import { PGlite } from "@electric-sql/pglite";

let db = null;
let initPromise = null;
const DB_NAME = "patient_registration_db";

// Enhanced database initialization with better persistence handling
export const initializeDB = async () => {
  // Return existing database if already initialized
  if (db) {
    try {
      // Test if the database is still working
      await db.query("SELECT 1");
      return db;
    } catch (error) {
      console.warn("Existing database connection failed, reinitializing...");
      db = null;
    }
  }

  // Return existing initialization promise if currently initializing
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log("Initializing PGlite database...");

      // Try persistent database first with IndexedDB backend
      try {
        console.log("Attempting persistent database with IndexedDB...");
        db = new PGlite({
          dataDir: `idb://${DB_NAME}`,
          debug: false,
        });

        // Wait for initialization and test the connection
        await new Promise((resolve) => setTimeout(resolve, 500));
        await db.query("SELECT 1");
        console.log("Persistent database (IndexedDB) initialized successfully");
      } catch (persistentError) {
        console.warn(
          "IndexedDB persistent database failed, trying file system persistence:",
          persistentError
        );

        try {
          // Try file system persistence
          db = new PGlite({
            dataDir: DB_NAME,
            debug: false,
          });

          await new Promise((resolve) => setTimeout(resolve, 500));
          await db.query("SELECT 1");
          console.log(
            "Persistent database (file system) initialized successfully"
          );
        } catch (fsError) {
          console.warn(
            "File system persistence failed, using in-memory database:",
            fsError
          );

          // Final fallback to in-memory database
          db = new PGlite();
          await new Promise((resolve) => setTimeout(resolve, 200));
          console.log("In-memory database initialized as fallback");
        }
      }

      // Create the patients table with enhanced schema
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
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create an index for better performance
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_patients_name 
        ON patients(lastName, firstName)
      `);

      // Create a trigger to update the updatedAt timestamp
      await db.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updatedAt = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `);

      await db.query(`
        DROP TRIGGER IF EXISTS update_patients_updated_at ON patients
      `);

      await db.query(`
        CREATE TRIGGER update_patients_updated_at
        BEFORE UPDATE ON patients
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
      `);

      console.log("Database schema and triggers created successfully");
      return db;
    } catch (error) {
      console.error("Critical error initializing database:", error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
};

// Enhanced notification system for cross-tab synchronization
const notifyTabs = (operation, data = null) => {
  try {
    const channel = new BroadcastChannel("patient_app_channel");
    const message = {
      type: "DB_UPDATED",
      operation,
      timestamp: Date.now(),
      data,
    };
    channel.postMessage(message);
    channel.close();
    console.log(`Notified other tabs about ${operation}`);
  } catch (error) {
    console.warn("Failed to notify other tabs:", error);
  }
};

// Reset function to clear the database instance
export const resetDB = () => {
  if (db) {
    try {
      db.close?.();
    } catch (error) {
      console.warn("Error closing database:", error);
    }
  }
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
       RETURNING id, firstName, lastName`,
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

    const newPatient = result.rows[0];
    notifyTabs("PATIENT_ADDED", newPatient);

    return newPatient.id;
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
       WHERE id = $1
       RETURNING firstName, lastName`,
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

    if (result.rowCount > 0) {
      notifyTabs("PATIENT_UPDATED", { id, ...result.rows[0] });
      return true;
    }

    return false;
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

    if (result.rowCount > 0) {
      notifyTabs("PATIENT_DELETED", { id });
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error deleting patient:", error);
    throw error;
  }
};

export const executeQuery = async (sqlQuery) => {
  const database = await initializeDB();

  try {
    const queryLower = sqlQuery.toLowerCase().trim();

    // Enhanced security checks
    const destructiveOperations = [
      "drop ",
      "truncate ",
      "delete from patients",
      "alter table patients drop",
    ];

    const isDestructive = destructiveOperations.some((op) =>
      queryLower.includes(op)
    );

    if (isDestructive) {
      throw new Error(
        "Destructive database operations are not allowed for safety"
      );
    }

    const result = await database.query(sqlQuery);

    // Notify other tabs if this was a modifying query
    if (
      queryLower.startsWith("insert") ||
      queryLower.startsWith("update") ||
      queryLower.startsWith("delete")
    ) {
      notifyTabs("QUERY_EXECUTED", { query: sqlQuery });
    }

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

// Function to check database health and reinitialize if needed
export const checkDatabaseHealth = async () => {
  try {
    if (!db) {
      await initializeDB();
      return true;
    }

    await db.query("SELECT COUNT(*) FROM patients");
    return true;
  } catch (error) {
    console.warn("Database health check failed, reinitializing...", error);
    db = null;
    initPromise = null;
    await initializeDB();
    return false;
  }
};
