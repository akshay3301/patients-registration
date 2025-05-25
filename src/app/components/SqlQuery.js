// components/SqlQuery.js
import { useState, useEffect } from "react";
import { executeQuery } from "../lib/db.js";

export default function SqlQuery({ refreshTrigger, onQueryExecuted }) {
  const [query, setQuery] = useState(
    "SELECT * FROM patients ORDER BY lastName, firstName"
  );
  const [queryResult, setQueryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);

  const sampleQueries = [
    "SELECT * FROM patients ORDER BY lastName, firstName",
    "SELECT id, firstName, lastName, email FROM patients WHERE email IS NOT NULL",
    "SELECT COUNT(*) as total_patients FROM patients",
    "SELECT gender, COUNT(*) as count FROM patients GROUP BY gender ORDER BY count DESC",
    "SELECT DATE_PART('year', AGE(dateOfBirth)) as age, firstName, lastName FROM patients ORDER BY age DESC",
    "SELECT * FROM patients WHERE phone IS NOT NULL AND phone != ''",
    "SELECT EXTRACT(YEAR FROM createdAt) as year, COUNT(*) as registrations FROM patients GROUP BY year ORDER BY year",
  ];

  useEffect(() => {
    if (query.trim()) {
      runQuery();
    }
  }, [refreshTrigger]);

  const runQuery = async () => {
    if (!query.trim()) {
      setError("Please enter a SQL query");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await executeQuery(query);
      setQueryResult(result);

      setQueryHistory((prev) => {
        const newHistory = [
          { query: query.trim(), timestamp: new Date(), success: true },
          ...prev.filter((h) => h.query !== query.trim()).slice(0, 9),
        ];
        return newHistory;
      });

      const modifyingKeywords = [
        "insert",
        "update",
        "delete",
        "create",
        "alter",
        "drop",
      ];
      const isModifying = modifyingKeywords.some((keyword) =>
        query.toLowerCase().trim().startsWith(keyword)
      );

      if (isModifying && onQueryExecuted) {
        onQueryExecuted();
      }
    } catch (err) {
      const errorMessage = `Query error: ${err.message}`;
      setError(errorMessage);
      setQueryResult(null);

      setQueryHistory((prev) => [
        {
          query: query.trim(),
          timestamp: new Date(),
          success: false,
          error: err.message,
        },
        ...prev.slice(0, 9),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const canRenderAsTable = () =>
    queryResult && queryResult.length > 0 && typeof queryResult[0] === "object";

  const renderQueryResults = () => {
    if (!queryResult) return null;

    const formatDateValue = (value) => {
      const date = new Date(value);
      if (isNaN(date)) return String(value);
      return date.toISOString().split("T")[0];
    };

    if (queryResult.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-yellow-400 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-yellow-800">
              Query executed successfully but returned no results.
            </span>
          </div>
        </div>
      );
    }

    if (!canRenderAsTable()) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mt-4 overflow-x-auto">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Query Result:
          </h4>
          <pre className="text-sm text-gray-800 whitespace-pre-wrap">
            {JSON.stringify(queryResult, null, 2)}
          </pre>
        </div>
      );
    }

    const columns = Object.keys(queryResult[0]);

    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">
            Query Results ({queryResult.length} row
            {queryResult.length !== 1 ? "s" : ""})
          </h4>
          <button
            onClick={() => {
              const csvContent = [
                columns.join(","),
                ...queryResult.map((row) =>
                  columns
                    .map((col) =>
                      typeof row[col] === "string" && row[col].includes(",")
                        ? `"${row[col]}"`
                        : row[col] ?? ""
                    )
                    .join(",")
                ),
              ].join("\n");

              const blob = new Blob([csvContent], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `query_results_${
                new Date().toISOString().split("T")[0]
              }.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {queryResult.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className="py-3 px-4 text-sm text-gray-800 border-b"
                    >
                      {row[column] === null ? (
                        <span className="text-gray-400 italic">NULL</span>
                      ) : column.toLowerCase() === "dateofbirth" ? (
                        formatDateValue(row[column])
                      ) : (
                        String(row[column])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        SQL Query Interface
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Enter SQL Query
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows="4"
              className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Enter SQL query..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  runQuery();
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Tip: Press Ctrl+Enter (Cmd+Enter on Mac) to execute
            </p>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={runQuery}
              disabled={isLoading || !query.trim()}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                isLoading || !query.trim()
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "Running..." : "Run Query"}
            </button>

            <button
              onClick={() => setQuery("")}
              className="px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>

            <span className="text-sm text-gray-600">
              or try a sample query below
            </span>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Sample Queries:
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {sampleQueries.map((sampleQuery, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(sampleQuery)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-sm text-left transition-colors"
                >
                  <span className="font-mono text-xs">{sampleQuery}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-medium text-blue-900 mb-3">Database Schema</h3>
            <div className="text-sm text-blue-800">
              <div className="font-mono bg-blue-100 p-2 rounded text-xs">
                <div className="font-semibold mb-1">patients</div>
                <div className="ml-2 space-y-1">
                  <div>
                    <span className="text-blue-600">id</span> (Serial, PK)
                  </div>
                  <div>firstName (Text)</div>
                  <div>lastName (Text)</div>
                  <div>dateOfBirth (Date)</div>
                  <div>gender (Text)</div>
                  <div>email (Text)</div>
                  <div>phone (Text)</div>
                  <div>address (Text)</div>
                  <div>createdAt (Timestamp)</div>
                  <div>updatedAt (Timestamp)</div>
                </div>
              </div>
            </div>
          </div>

          {queryHistory.length > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="font-medium text-gray-900 mb-3">Recent Queries</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {queryHistory.map((item, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs cursor-pointer transition-colors ${
                      item.success
                        ? "bg-green-100 hover:bg-green-200 border border-green-200"
                        : "bg-red-100 hover:bg-red-200 border border-red-200"
                    }`}
                    onClick={() => setQuery(item.query)}
                    title={
                      item.success ? "Click to reuse" : `Error: ${item.error}`
                    }
                  >
                    <div
                      className={`font-mono ${
                        item.success ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {item.query.length > 50
                        ? `${item.query.substring(0, 50)}...`
                        : item.query}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        item.success ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatTimestamp(item.timestamp)}{" "}
                      {!item.success && "(Failed)"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800">Query Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-blue-800">Executing query...</span>
          </div>
        </div>
      )}

      {!isLoading && queryResult && renderQueryResults()}
    </div>
  );
}
