#!/usr/bin/env node

// Script to export Supabase database schema to JSON files
const {createClient} = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error(
    'Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY',
  );
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to fetch OpenAPI spec
async function fetchOpenApiSpec() {
  try {
    const restUrl = `${supabaseUrl}/rest/v1/`;
    console.log(`    - Fetching OpenAPI spec from ${restUrl}...`);
    console.log(`    - Using API key: ${supabaseAnonKey.substring(0, 20)}...`);

    const response = await fetch(restUrl, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    console.log(`    - Response status: ${response.status}`);
    console.log(
      '    - Response headers:',
      Object.fromEntries(response.headers.entries()),
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('    - Error response body:', errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`,
      );
    }

    const spec = await response.json();
    console.log(
      `    - Found ${Object.keys(spec.definitions || {}).length} table definitions`,
    );
    return spec.definitions || {};
  } catch (error) {
    console.error('    ❌ Failed to fetch OpenAPI spec:');
    console.error('    - Error message:', error.message);
    console.error('    - Error stack:', error.stack);
    console.error('    - Error cause:', error.cause);
    return {};
  }
}

// Map OpenAPI types to JavaScript types
function mapOpenApiTypeToJs(type, format) {
  if (type === 'integer' || type === 'number') {
    return 'number';
  }
  if (type === 'boolean') {
    return 'boolean';
  }
  if (type === 'string') {
    return 'string';
  }
  return 'object'; // Default fallback
}

// Schema functions using sample data and known table structure
const schema = {
  async getAllTables() {
    const definitions = await fetchOpenApiSpec();
    const tables = Object.keys(definitions);
    return tables.map(name => ({table_name: name, table_schema: 'public'}));
  },

  async getTableSchema(tableName, definitions) {
    try {
      console.log(`    - Analyzing ${tableName}...`);

      // Get sample data to understand structure (still useful for sample values)
      const {data: sampleData, error: sampleError} = await supabase
        .from(tableName)
        .select('*')
        .limit(3);

      // Get count
      const {count, error: countError} = await supabase
        .from(tableName)
        .select('*', {count: 'exact', head: true});

      // Get definition from OpenAPI spec
      const definition = definitions[tableName];
      let columns = [];

      if (definition && definition.properties) {
        // Use OpenAPI definition as primary source
        columns = Object.keys(definition.properties).map((key, index) => {
          const prop = definition.properties[key];
          return {
            column_name: key,
            data_type: prop.format || prop.type, // Store SQL/OpenAPI type
            javascript_type: mapOpenApiTypeToJs(prop.type, prop.format),
            sample_values: sampleData
              ? sampleData
                  .map(row => row[key])
                  .filter(val => val !== null && val !== undefined)
              : [],
            ordinal_position: index + 1,
            has_null_values: sampleData
              ? sampleData.some(row => row[key] === null)
              : false, // Can't know for sure without data
            description: prop.description,
          };
        });
      } else if (sampleData && sampleData.length > 0) {
        // Fallback to inference from sample data
        console.log(
          `    ℹ️  No OpenAPI definition for ${tableName}, inferring from sample data`,
        );
        columns = Object.keys(sampleData[0]).map((key, index) => ({
          column_name: key,
          javascript_type: typeof sampleData[0][key],
          sample_values: sampleData
            .map(row => row[key])
            .filter(val => val !== null),
          ordinal_position: index + 1,
          has_null_values: sampleData.some(row => row[key] === null),
        }));
      }

      const tableSchema = {
        table_name: tableName,
        row_count: count || 0,
        sample_rows: sampleData || [],
        columns: columns,
        errors: {
          sample_error: sampleError?.message || null,
          count_error: countError?.message || null,
          definition_found: !!definition,
        },
      };

      return tableSchema;
    } catch (error) {
      console.warn(`    ⚠️  Error processing ${tableName}:`, error.message);
      return {
        table_name: tableName,
        row_count: 0,
        sample_rows: [],
        columns: [],
        errors: {
          general_error: error.message,
        },
      };
    }
  },

  async getAllTablesWithSchemas() {
    // Fetch definitions once
    const definitions = await fetchOpenApiSpec();
    const tables = Object.keys(definitions);
    const tablesWithSchemas = [];

    for (const tableName of tables) {
      const tableSchema = await this.getTableSchema(tableName, definitions);
      tablesWithSchemas.push(tableSchema);
    }

    return tablesWithSchemas;
  },
};

async function exportSchemas() {
  try {
    console.log('🚀 Starting database schema export...');

    // Create output directory
    const outputDir = path.join(__dirname, '..', 'database-schemas');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, {recursive: true});
    }

    // Export all tables list
    console.log('📋 Getting known tables...');
    const allTables = await schema.getAllTables();
    fs.writeFileSync(
      path.join(outputDir, 'all-tables.json'),
      JSON.stringify(allTables, null, 2),
    );
    console.log(`✅ Exported ${allTables.length} tables to all-tables.json`);

    // Export complete schema
    console.log('🔍 Analyzing database schema...');
    const completeSchema = await schema.getAllTablesWithSchemas();
    fs.writeFileSync(
      path.join(outputDir, 'complete-schema.json'),
      JSON.stringify(completeSchema, null, 2),
    );
    console.log('✅ Exported complete schema to complete-schema.json');

    // Export individual table schemas
    console.log('📄 Exporting individual table schemas...');
    for (const tableSchema of completeSchema) {
      const tableName = tableSchema.table_name;
      fs.writeFileSync(
        path.join(outputDir, `${tableName}-schema.json`),
        JSON.stringify(tableSchema, null, 2),
      );
    }

    // Create summary
    const summary = {
      export_date: new Date().toISOString(),
      total_tables: allTables.length,
      tables: allTables.map(t => t.table_name),
      successful_tables: completeSchema.filter(t => !t.errors.general_error)
        .length,
      failed_tables: completeSchema
        .filter(t => t.errors.general_error)
        .map(t => ({
          table: t.table_name,
          error: t.errors.general_error,
        })),
      total_rows: completeSchema.reduce(
        (sum, t) => sum + (t.row_count || 0),
        0,
      ),
      files_created: [
        'all-tables.json',
        'complete-schema.json',
        'export-summary.json',
        ...allTables.map(t => `${t.table_name}-schema.json`),
      ],
    };

    fs.writeFileSync(
      path.join(outputDir, 'export-summary.json'),
      JSON.stringify(summary, null, 2),
    );

    console.log('\n🎉 Schema export completed successfully!');
    console.log(`📁 Files saved to: ${outputDir}`);
    console.log(`📊 Total tables: ${summary.total_tables}`);
    console.log(`✅ Successful: ${summary.successful_tables}`);
    console.log(`❌ Failed: ${summary.failed_tables.length}`);
    console.log(`📈 Total rows across all tables: ${summary.total_rows}`);

    if (summary.failed_tables.length > 0) {
      console.log('\n⚠️  Failed tables:');
      summary.failed_tables.forEach(({table, error}) => {
        console.log(`  - ${table}: ${error}`);
      });
    }

    console.log('\n📁 Files created:');
    summary.files_created.forEach(file => {
      console.log(`  - ${file}`);
    });
  } catch (error) {
    console.error('❌ Error exporting schemas:', error);
    process.exit(1);
  }
}

// Run the export
exportSchemas();
