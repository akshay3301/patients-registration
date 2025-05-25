// components/PatientForm.js
import { useState } from "react";
import { addPatient, getAllPatients } from "../lib/db.js";

export default function PatientForm({ onPatientAdded }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear message when user starts typing
    if (message.text) {
      setMessage({ text: "", type: "" });
    }
  };

  const checkForDuplicate = async (firstName, lastName, phone) => {
    try {
      const existingPatients = await getAllPatients();

      // Check for exact name and phone match
      const duplicate = existingPatients.find((patient) => {
        const patientFirstName = (patient.firstname || patient.firstName || "")
          .toLowerCase()
          .trim();
        const patientLastName = (patient.lastname || patient.lastName || "")
          .toLowerCase()
          .trim();
        const patientPhone = (patient.phone || "").replace(/\D/g, ""); // Remove non-digits

        const inputFirstName = firstName.toLowerCase().trim();
        const inputLastName = lastName.toLowerCase().trim();
        const inputPhone = phone.replace(/\D/g, ""); // Remove non-digits

        // Match if both name and phone are the same
        const nameMatch =
          patientFirstName === inputFirstName &&
          patientLastName === inputLastName;
        const phoneMatch =
          patientPhone && inputPhone && patientPhone === inputPhone;

        return nameMatch && phoneMatch;
      });

      return duplicate;
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const requiredFields = ["firstName", "lastName", "dateOfBirth", "gender"];
      const missingFields = requiredFields.filter((field) => !formData[field]);

      if (missingFields.length > 0) {
        throw new Error(
          `Please fill in all required fields: ${missingFields.join(", ")}`
        );
      }

      // Check for duplicate patient if phone number is provided
      if (formData.phone && formData.phone.trim()) {
        const duplicatePatient = await checkForDuplicate(
          formData.firstName,
          formData.lastName,
          formData.phone
        );

        if (duplicatePatient) {
          setMessage({
            text: `Patient already exists! A patient with the name "${formData.firstName} ${formData.lastName}" and phone number "${formData.phone}" is already registered.`,
            type: "warning",
          });
          setIsLoading(false);
          return;
        }
      }

      // Add the new patient
      await addPatient(formData);

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        email: "",
        phone: "",
        address: "",
      });

      setMessage({
        text: "Patient registered successfully!",
        type: "success",
      });

      if (onPatientAdded) onPatientAdded();
    } catch (error) {
      setMessage({
        text: `Error: ${error.message}`,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Register New Patient
      </h2>

      {message.text && (
        <div
          className={`p-3 mb-4 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : message.type === "warning"
              ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {message.type === "success" && (
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {message.type === "warning" && (
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {message.type === "error" && (
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-3 py-2 text-gray-900 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="First Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-3 py-2 text-gray-900 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Last Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Date of Birth *
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full px-3 py-2 text-gray-900 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="dd-mm-yyyy"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Gender *
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 text-gray-900 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled className="text-gray-500">
                Select Gender
              </option>
              <option value="male" className="text-gray-900">
                Male
              </option>
              <option value="female" className="text-gray-900">
                Female
              </option>
              <option value="other" className="text-gray-900">
                Other
              </option>
              <option value="prefer_not_to_say" className="text-gray-900">
                Prefer not to say
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 text-gray-900 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 text-gray-900 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Phone Number"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">
            Address
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 text-gray-900 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Address"
          ></textarea>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
              isLoading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Checking & Registering..." : "Register Patient"}
          </button>
        </div>
      </form>
    </div>
  );
}
