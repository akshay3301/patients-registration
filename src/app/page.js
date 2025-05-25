"use client";
import { useState, useEffect, useRef } from "react";
import PatientForm from "./components/PatientForm";
import Head from "next/head";
import PatientList from "./components/PatientList";
import SqlQuery from "./components/SqlQuery";
import { initializeDB, checkDatabaseHealth } from "./lib/db.js";

export default function Home() {
  const [activeTab, setActiveTab] = useState("register");
  const [dbInitialized, setDbInitialized] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dbStatus, setDbStatus] = useState("initializing");
  const channelRef = useRef(null);
  const healthCheckInterval = useRef(null);

  useEffect(() => {
    const setupApplication = async () => {
      try {
        setDbStatus("initializing");

        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            await initializeDB();
            setDbInitialized(true);
            setDbStatus("ready");
            break;
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              setDbStatus("error");
              throw error;
            }
            await new Promise((r) => setTimeout(r, 1000 * retryCount));
          }
        }

        channelRef.current = new BroadcastChannel("patient_app_channel");

        channelRef.current.onmessage = (event) => {
          if (event.data.type === "DB_UPDATED") {
            const isVisible = !document.hidden;
            if (isVisible) {
              setRefreshTrigger((prev) => prev + 1);
            } else {
              sessionStorage.setItem("forceReloadOnVisibility", "true");
            }
          }
        };

        healthCheckInterval.current = setInterval(async () => {
          try {
            const healthy = await checkDatabaseHealth();
            if (!healthy) {
              setRefreshTrigger((prev) => prev + 1);
            }
          } catch (error) {
            setDbStatus("error");
          }
        }, 30000);
      } catch (error) {
        console.error("Failed to setup app:", error);
        setDbStatus("error");
      }
    };

    setupApplication();

    return () => {
      if (channelRef.current) channelRef.current.close();
      if (healthCheckInterval.current)
        clearInterval(healthCheckInterval.current);
    };
  }, []);

  // Force reload if update was missed while hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && dbInitialized) {
        const shouldReload = sessionStorage.getItem("forceReloadOnVisibility");
        if (shouldReload) {
          sessionStorage.removeItem("forceReloadOnVisibility");
          window.location.reload();
        } else {
          setRefreshTrigger((prev) => prev + 1);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [dbInitialized]);

  const notifyDatabaseChange = (operation = "unknown") => {
    setRefreshTrigger((prev) => prev + 1);
    try {
      const channel = new BroadcastChannel("patient_app_channel");
      channel.postMessage({
        type: "DB_UPDATED",
        operation,
        timestamp: Date.now(),
        source: "current_tab",
      });
      channel.close();
    } catch (error) {
      console.warn("Failed to notify other tabs:", error);
    }
  };

  const renderDatabaseStatus = () => {
    if (dbStatus === "initializing") {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Initializing database...</p>
        </div>
      );
    }
    if (dbStatus === "error") {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 font-medium">
            Database initialization failed
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please refresh the page to try again
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Patient Registration System</title>
        <meta
          name="description"
          content="Patient registration system with persistent data storage"
        />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">
            Patient Registration System
          </h1>
          {dbInitialized && (
            <div className="ml-4 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="ml-2 text-sm text-green-600 font-medium">
                Database Ready
              </span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Tabs navigation */}
          <div className="flex border-b mb-6">
            {["register", "records", "query"].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 mr-2 font-medium transition-colors ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-blue-500"
                }`}
                onClick={() => setActiveTab(tab)}
                disabled={!dbInitialized}
              >
                {tab === "register"
                  ? "Register Patient"
                  : tab === "records"
                  ? "View Records"
                  : "SQL Query"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {!dbInitialized ? (
            renderDatabaseStatus()
          ) : (
            <>
              {activeTab === "register" && (
                <PatientForm
                  onPatientAdded={() => notifyDatabaseChange("PATIENT_ADDED")}
                />
              )}
              {activeTab === "records" && (
                <PatientList
                  refreshTrigger={refreshTrigger}
                  onPatientUpdated={() =>
                    notifyDatabaseChange("PATIENT_UPDATED")
                  }
                  onPatientDeleted={() =>
                    notifyDatabaseChange("PATIENT_DELETED")
                  }
                />
              )}
              {activeTab === "query" && (
                <SqlQuery
                  refreshTrigger={refreshTrigger}
                  onQueryExecuted={() => notifyDatabaseChange("QUERY_EXECUTED")}
                />
              )}
            </>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-gray-500 text-sm mt-8">
        <div className="flex items-center justify-center space-x-4">
          <span>Patient Registration System</span>
          {dbInitialized && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              Persistent Storage Active
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
