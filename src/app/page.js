"use client";
import { useState, useEffect } from "react";
import PatientForm from "./components/PatientForm";
import Head from "next/head";
import PatientList from "./components/PatientList";
import SqlQuery from "./components/SqlQuery";
import { initializeDB } from "./lib/db.js";

export default function Home() {
  const [activeTab, setActiveTab] = useState("register");
  const [dbInitialized, setDbInitialized] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const setupDB = async () => {
      await initializeDB();
      setDbInitialized(true);
    };

    setupDB();

    // Setup BroadcastChannel for cross-tab communication
    const channel = new BroadcastChannel("patient_app_channel");
    channel.onmessage = (event) => {
      if (event.data.type === "DB_UPDATED") {
        // Trigger refresh when database is updated in another tab
        setRefreshTrigger((prev) => prev + 1);
      }
    };

    return () => channel.close();
  }, []);

  // Function to notify other tabs about database updates
  const notifyDatabaseChange = () => {
    const channel = new BroadcastChannel("patient_app_channel");
    channel.postMessage({ type: "DB_UPDATED" });
    // Also refresh current tab
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Patient Registration System</title>
        <meta
          name="description"
          content="Patient registration system using PGlite"
        />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">
          Patient Registration System
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Tabs navigation */}
          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 mr-2 font-medium ${
                activeTab === "register"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-blue-500"
              }`}
              onClick={() => setActiveTab("register")}
            >
              Register Patient
            </button>
            <button
              className={`px-4 py-2 mr-2 font-medium ${
                activeTab === "records"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-blue-500"
              }`}
              onClick={() => setActiveTab("records")}
            >
              View Records
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "query"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-blue-500"
              }`}
              onClick={() => setActiveTab("query")}
            >
              SQL Query
            </button>
          </div>

          {/* Tab content */}
          {!dbInitialized ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p>Initializing database...</p>
            </div>
          ) : (
            <>
              {activeTab === "register" && (
                <PatientForm onPatientAdded={notifyDatabaseChange} />
              )}
              {activeTab === "records" && (
                <PatientList refreshTrigger={refreshTrigger} />
              )}
              {activeTab === "query" && (
                <SqlQuery refreshTrigger={refreshTrigger} />
              )}
            </>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-gray-500 text-sm mt-8">
        Patient Registration System - Frontend Only with PGlite
      </footer>
    </div>
  );
}
