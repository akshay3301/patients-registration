import { PGlite } from "@electric-sql/pglite";

let db = null;
let initPromise = null;

export const initializeDB = async () => {
  // Return existing database if already initialized
  if (db) return db;

  // Return existing initialization promise if currently initializing
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log("Initializing PGlite database...");

      // Method 1: Try with explicit options
      const dbOptions = {
        dataDir: "patient_registration_db",
        // Add these options to help with WebAssembly loading
        wasmModule: undefined, // Let PGlite handle WASM loading
        debug: false,
      };

      // Try different initialization approaches
      try {
        if (PGlite.create) {
          db = await PGlite.create(dbOptions);
        } else {
          db = new PGlite(dbOptions);
        }
      } catch (wasmError) {
        console.warn(
          "Failed to create persistent database, trying in-memory:",
          wasmError
        );

        // Fallback to in-memory database
        if (PGlite.create) {
          db = await PGlite.create();
        } else {
          db = new PGlite();
        }
      }

      // Wait for database to be ready
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Create the patients table
      await db.query(`
        CREATE TABLE IF NOT EXISTS patients (
          id SERIAL PRIMARY KEY,
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          dateOfBirth DATE NOT NULL,
          gender TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          address TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log("Database initialized successfully");
      return db;
    } catch (error) {
      console.error("Error initializing database:", error);

      // Final fallback - try minimal initialization
      try {
        console.log("Attempting minimal database initialization...");
        db = new PGlite();

        await db.query(`
          CREATE TABLE IF NOT EXISTS patients (
            id SERIAL PRIMARY KEY,
            firstName TEXT NOT NULL,
            lastName TEXT NOT NULL,
            dateOfBirth DATE NOT NULL,
            gender TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        console.log("Minimal database initialized successfully");
        return db;
      } catch (fallbackError) {
        console.error(
          "All database initialization attempts failed:",
          fallbackError
        );
        initPromise = null; // Reset promise so it can be retried
        throw fallbackError;
      }
    }
  })();

  return initPromise;
};

// Reset function to clear the database instance (useful for testing)
export const resetDB = () => {
  db = null;
  initPromise = null;
};

export const addPatient = async (patientData) => {
  const database = await initializeDB();

  const { firstName, lastName, dateOfBirth, gender, email, phone, address } =
    patientData;

  try {
    const result = await database.query(
      `INSERT INTO patients (firstName, lastName, dateOfBirth, gender, email, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        firstName,
        lastName,
        dateOfBirth,
        gender,
        email || null,
        phone || null,
        address || null,
      ]
    );
    return result.rows[0].id;
  } catch (error) {
    console.error("Error adding patient:", error);
    throw error;
  }
};

export const getAllPatients = async () => {
  const database = await initializeDB();

  try {
    const result = await database.query(`
      SELECT * FROM patients
      ORDER BY lastName, firstName
    `);
    return result.rows;
  } catch (error) {
    console.error("Error getting patients:", error);
    throw error;
  }
};

export const getPatientById = async (id) => {
  const database = await initializeDB();

  try {
    const result = await database.query(
      "SELECT * FROM patients WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error getting patient by ID:", error);
    throw error;
  }
};

export const updatePatient = async (id, updateData) => {
  const database = await initializeDB();

  const { firstName, lastName, dateOfBirth, gender, email, phone, address } =
    updateData;

  try {
    const result = await database.query(
      `UPDATE patients 
       SET firstName = $2, lastName = $3, dateOfBirth = $4, gender = $5, 
           email = $6, phone = $7, address = $8
       WHERE id = $1`,
      [
        id,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        email || null,
        phone || null,
        address || null,
      ]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error("Error updating patient:", error);
    throw error;
  }
};

export const deletePatient = async (id) => {
  const database = await initializeDB();

  try {
    const result = await database.query("DELETE FROM patients WHERE id = $1", [
      id,
    ]);
    return result.rowCount > 0;
  } catch (error) {
    console.error("Error deleting patient:", error);
    throw error;
  }
};

export const executeQuery = async (sqlQuery) => {
  const database = await initializeDB();

  try {
    const queryLower = sqlQuery.toLowerCase().trim();
    if (
      queryLower.startsWith("drop ") ||
      queryLower.startsWith("truncate ") ||
      (queryLower.startsWith("alter ") && !queryLower.includes("add column"))
    ) {
      throw new Error("Destructive database operations are not allowed");
    }

    const result = await database.query(sqlQuery);

    if (Array.isArray(result?.rows)) {
      return result.rows;
    } else {
      return [
        {
          operation: result?.command || "UNKNOWN",
          rowCount: result?.rowCount ?? 0,
          message: `${result?.command || "Operation"} completed successfully`,
        },
      ];
    }
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
};
