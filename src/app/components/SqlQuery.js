// components/SqlQuery.js
import { useState } from "react";
import { executeQuery } from "../lib/db.js";

export default function SqlQuery({ refreshTrigger }) {
  const [query, setQuery] = useState("SELECT * FROM patients");
  const [queryResult, setQueryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sampleQueries = [
    "SELECT * FROM patients",
    "SELECT id, firstName, lastName FROM patients ORDER BY lastName",
    "SELECT COUNT(*) as total_patients FROM patients",
    "SELECT gender, COUNT(*) as count FROM patients GROUP BY gender",
  ];

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
    } catch (err) {
      setError(`Query error: ${err.message}`);
      setQueryResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const canRenderAsTable = () =>
    queryResult && queryResult.length > 0 && typeof queryResult[0] === "object";

  const renderQueryResults = () => {
    if (!queryResult) return null;

    if (queryResult.length === 0) {
      return (
        <div className="text-gray-600 mt-4">Query returned no results.</div>
      );
    }

    if (!canRenderAsTable()) {
      return (
        <div className="bg-gray-100 text-gray-800 p-4 rounded-md mt-4 overflow-x-auto">
          <pre>{JSON.stringify(queryResult, null, 2)}</pre>
        </div>
      );
    }

    const columns = Object.keys(queryResult[0]);

    return (
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white border border-gray-300">
          <thead className="bg-gray-100 text-gray-900">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="py-2 px-4 border-b text-left font-medium"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {queryResult.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 text-gray-800">
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="py-2 px-4 border-b">
                    {row[column] === null ? "NULL" : String(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">SQL Query</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-800 mb-1">
          Enter SQL Query
        </label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows="3"
          className="w-full px-3 py-2 text-gray-900 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          placeholder="Enter SQL query..."
        ></textarea>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={runQuery}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isLoading ? "Running..." : "Run Query"}
        </button>
        <span className="text-sm text-gray-600">or try a sample query:</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {sampleQueries.map((sampleQuery, index) => (
          <button
            key={index}
            onClick={() => setQuery(sampleQuery)}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded text-sm"
          >
            {sampleQuery.length > 40
              ? `${sampleQuery.substring(0, 40)}...`
              : sampleQuery}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4 text-gray-800">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p>Running query...</p>
        </div>
      ) : (
        queryResult && (
          <div>
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              Results
            </h3>
            {renderQueryResults()}
          </div>
        )
      )}

      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="font-medium text-gray-900 mb-2">Database Schema</h3>
        <code className="text-sm block text-gray-800 bg-gray-100 p-2 rounded">
          patients (<span className="text-blue-600 font-mono">id</span>,
          firstName, lastName, dateOfBirth, gender, email, phone, address,
          createdAt)
        </code>
      </div>
    </div>
  );
}
