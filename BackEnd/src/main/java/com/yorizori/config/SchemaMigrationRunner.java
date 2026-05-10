package com.yorizori.config;

import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SchemaMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public SchemaMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        normalizeColumn("ingest_jobs", "source", "VARCHAR(50) NOT NULL DEFAULT 'COOKRCP01'");
        normalizeColumn("ingest_jobs", "job_type", "VARCHAR(50) NOT NULL DEFAULT 'RECIPE_INGEST'");
        relaxStrictColumns("ingest_jobs");
        relaxStrictColumns("api_raw_responses");
    }

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                  FROM information_schema.columns
                 WHERE table_schema = DATABASE()
                   AND table_name = ?
                   AND column_name = ?
                """,
                Integer.class,
                tableName,
                columnName
        );
        return count != null && count > 0;
    }

    private void normalizeColumn(String tableName, String columnName, String definition) {
        if (columnExists(tableName, columnName)) {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " MODIFY COLUMN " + columnName + " " + definition);
        }
    }

    private void relaxStrictColumns(String tableName) {
        List<ExistingColumn> columns = jdbcTemplate.query(
                """
                SELECT column_name, column_type
                  FROM information_schema.columns
                 WHERE table_schema = DATABASE()
                   AND table_name = ?
                   AND is_nullable = 'NO'
                   AND column_default IS NULL
                   AND extra NOT LIKE '%auto_increment%'
                """,
                (rs, rowNum) -> new ExistingColumn(rs.getString("column_name"), rs.getString("column_type")),
                tableName
        );
        for (ExistingColumn column : columns) {
            if (isSafeIdentifier(column.name())) {
                jdbcTemplate.execute("ALTER TABLE " + tableName + " MODIFY COLUMN `" + column.name() + "` "
                        + column.type() + " NULL");
            }
        }
    }

    private boolean isSafeIdentifier(String identifier) {
        return identifier != null && identifier.matches("[A-Za-z0-9_]+");
    }

    private record ExistingColumn(String name, String type) {
    }
}
