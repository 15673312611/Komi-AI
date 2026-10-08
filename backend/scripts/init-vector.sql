-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the ai schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS ai;

-- Set up vector similarity search functions
CREATE OR REPLACE FUNCTION vector_similarity(vector1 vector, vector2 vector)
RETURNS float
AS $$
BEGIN
    RETURN 1 - (vector1 <=> vector2);
END;
$$ LANGUAGE plpgsql;

-- Ensure proper permissions
GRANT USAGE ON SCHEMA ai TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ai TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ai TO postgres; 