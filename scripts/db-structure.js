import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function exploreDatabase() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // 1. Listar todas las tablas
    console.log('=== TABLAS ===\n');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    tables.rows.forEach(row => {
      console.log(`📋 ${row.table_name}`);
    });

    console.log('\n=== ESTRUCTURA DETALLADA ===\n');

    // 2. Para cada tabla, mostrar sus columnas
    for (const table of tables.rows) {
      const tableName = table.table_name;
      
      console.log(`\n📊 Tabla: ${tableName}`);
      console.log('─'.repeat(60));
      
      const columns = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      columns.rows.forEach(col => {
        const type = col.character_maximum_length 
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? `DEFAULT ${col.column_default}` : '';
        
        console.log(`  • ${col.column_name.padEnd(30)} ${type.padEnd(20)} ${nullable.padEnd(10)} ${defaultVal}`);
      });

      // Mostrar constraints (primary keys, foreign keys, unique, etc)
      const constraints = await client.query(`
        SELECT
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.table_schema = 'public' 
          AND tc.table_name = $1;
      `, [tableName]);

      if (constraints.rows.length > 0) {
        console.log('\n  Constraints:');
        constraints.rows.forEach(c => {
          if (c.constraint_type === 'PRIMARY KEY') {
            console.log(`    🔑 PRIMARY KEY: ${c.column_name}`);
          } else if (c.constraint_type === 'FOREIGN KEY') {
            console.log(`    🔗 FOREIGN KEY: ${c.column_name} → ${c.foreign_table_name}.${c.foreign_column_name}`);
          } else if (c.constraint_type === 'UNIQUE') {
            console.log(`    ✨ UNIQUE: ${c.column_name}`);
          }
        });
      }

      // Mostrar índices
      const indexes = await client.query(`
        SELECT
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = $1;
      `, [tableName]);

      if (indexes.rows.length > 0) {
        console.log('\n  Índices:');
        indexes.rows.forEach(idx => {
          console.log(`    📇 ${idx.indexname}`);
        });
      }
    }

    // 3. Contar registros en cada tabla
    console.log('\n\n=== CONTEO DE REGISTROS ===\n');
    for (const table of tables.rows) {
      const count = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`${table.table_name.padEnd(30)} ${count.rows[0].count} registros`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

exploreDatabase();
