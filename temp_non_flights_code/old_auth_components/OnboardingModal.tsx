"use client";

import React, { useState, useMemo } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useRouter } from "next/navigation";
import ModalLoader from "../ModalLoader";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface Step1Data {
  dateOfBirth: string;
  gender: string;
  passportNationality: string;
}

interface Step2Data {
  allergies: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  foodPreferences: string;
  foodPreferencesOther: string;
}

export default function OnboardingModal({
  isOpen,
  onClose,
  userId,
}: OnboardingModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 state (mandatory)
  const [step1Data, setStep1Data] = useState<Step1Data>({
    dateOfBirth: "",
    gender: "",
    passportNationality: "",
  });

  // Step 2 state (optional)
  const [step2Data, setStep2Data] = useState<Step2Data>({
    allergies: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    foodPreferences: "",
    foodPreferencesOther: "",
  });

  const handleStep1Change = (field: keyof Step1Data, value: string) => {
    setStep1Data((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleStep2Change = (field: keyof Step2Data, value: string) => {
    setStep2Data((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (
      !step1Data.dateOfBirth ||
      !step1Data.gender ||
      !step1Data.passportNationality
    ) {
      setError("Please fill in all required fields");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        setError("");
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setError("");
    }
  };

  // Check if any optional field is filled
  const hasOptionalData = useMemo(() => {
    return !!(
      step2Data.allergies ||
      step2Data.emergencyContactName ||
      step2Data.emergencyContactPhone ||
      (step2Data.foodPreferences &&
        step2Data.foodPreferences !== "No restrictions") ||
      step2Data.foodPreferencesOther
    );
  }, [step2Data]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      // Determine final food preference value
      let finalFoodPreference = step2Data.foodPreferences;
      if (
        step2Data.foodPreferences === "Other" &&
        step2Data.foodPreferencesOther
      ) {
        finalFoodPreference = step2Data.foodPreferencesOther;
      }

      const userData = {
        // Step 1 data (mandatory)
        dateOfBirth: step1Data.dateOfBirth,
        gender: step1Data.gender,
        passportNationality: step1Data.passportNationality,
        // Step 2 data (optional)
        allergies: step2Data.allergies || "",
        emergencyContactName: step2Data.emergencyContactName || "",
        emergencyContactPhone: step2Data.emergencyContactPhone || "",
        foodPreferences: finalFoodPreference || "",
        // Metadata
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore with user ID as document ID
      await setDoc(doc(db, "users", userId), userData);

      // Close modal and redirect to dashboard
      onClose();
      router.push(`/dashboard/${userId}`);
    } catch (error) {
      console.error("Error saving user data:", error);
      setError("Failed to save your information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const genderOptions = [
    "Male",
    "Female",
    "Non-binary",
    "Prefer not to say",
    "Other",
  ];

  const countries = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Cape Verde",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czech Republic",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe",
  ];

  const foodPreferenceOptions = [
    "No restrictions",
    "Vegetarian",
    "Vegan",
    "Halal",
    "Kosher",
    "Gluten-free",
    "Lactose-free",
    "Keto",
    "Other",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* Modal */}
      <div className="relative z-10 backdrop-blur-xl bg-black/30 border border-white/20 rounded-xl p-6 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-xl font-medium text-white">Complete Profile</h2>
            <p className="text-xs text-gray-400 mt-1">
              Step {currentStep} of 2
            </p>
          </div>
          {/* Progress indicator */}
          <div className="flex space-x-1.5">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                currentStep >= 1 ? "bg-blue-400" : "bg-gray-600"
              }`}
            ></div>
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                currentStep >= 2 ? "bg-blue-400" : "bg-gray-600"
              }`}
            ></div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-3 py-2 rounded-lg mb-4 text-xs">
            {error}
          </div>
        )}

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-3.5">
            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Date of Birth <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={step1Data.dateOfBirth}
                onChange={(e) =>
                  handleStep1Change("dateOfBirth", e.target.value)
                }
                className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-400/50 focus:border-blue-400/50 backdrop-blur-sm transition-all"
                disabled={loading}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Gender <span className="text-red-400">*</span>
              </label>
              <select
                value={step1Data.gender}
                onChange={(e) => handleStep1Change("gender", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-400/50 focus:border-blue-400/50 backdrop-blur-sm transition-all"
                disabled={loading}
              >
                <option value="" className="bg-gray-900">
                  Select gender
                </option>
                {genderOptions.map((option) => (
                  <option key={option} value={option} className="bg-gray-900">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Passport Nationality */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Passport Nationality <span className="text-red-400">*</span>
              </label>
              <select
                value={step1Data.passportNationality}
                onChange={(e) =>
                  handleStep1Change("passportNationality", e.target.value)
                }
                className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-400/50 focus:border-blue-400/50 backdrop-blur-sm transition-all"
                disabled={loading}
              >
                <option value="" className="bg-gray-900">
                  Select country
                </option>
                {countries.map((country) => (
                  <option key={country} value={country} className="bg-gray-900">
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNext}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500/25 to-purple-500/25 hover:from-blue-500/35 hover:to-purple-500/35 disabled:from-blue-500/15 disabled:to-purple-500/15 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all backdrop-blur-sm border border-white/20"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Additional Information */}
        {currentStep === 2 && (
          <div className="space-y-3.5">
            <p className="text-xs text-gray-400 mb-3">
              These fields are optional and help us personalize your experience.
            </p>

            {/* Allergies */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Allergies
              </label>
              <textarea
                value={step2Data.allergies}
                onChange={(e) => handleStep2Change("allergies", e.target.value)}
                placeholder="Any food or environmental allergies"
                rows={2}
                className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400/50 focus:border-blue-400/50 backdrop-blur-sm resize-none transition-all"
                disabled={loading}
              />
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Emergency Contact
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={step2Data.emergencyContactName}
                  onChange={(e) =>
                    handleStep2Change("emergencyContactName", e.target.value)
                  }
                  placeholder="Contact name"
                  className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400/50 focus:border-blue-400/50 backdrop-blur-sm transition-all"
                  disabled={loading}
                />
                <input
                  type="tel"
                  value={step2Data.emergencyContactPhone}
                  onChange={(e) =>
                    handleStep2Change("emergencyContactPhone", e.target.value)
                  }
                  placeholder="Phone number"
                  className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400/50 focus:border-blue-400/50 backdrop-blur-sm transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Food Preferences */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Food Preferences
              </label>
              <select
                value={step2Data.foodPreferences}
                onChange={(e) =>
                  handleStep2Change("foodPreferences", e.target.value)
                }
                className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-400/50 focus:border-blue-400/50 backdrop-blur-sm transition-all"
                disabled={loading}
              >
                <option value="" className="bg-gray-900">
                  Select preference
                </option>
                {foodPreferenceOptions.map((option) => (
                  <option key={option} value={option} className="bg-gray-900">
                    {option}
                  </option>
                ))}
              </select>
              {step2Data.foodPreferences === "Other" && (
                <input
                  type="text"
                  value={step2Data.foodPreferencesOther}
                  onChange={(e) =>
                    handleStep2Change("foodPreferencesOther", e.target.value)
                  }
                  placeholder="Please specify your preference"
                  className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400/50 focus:border-blue-400/50 backdrop-blur-sm mt-2 transition-all"
                  disabled={loading}
                />
              )}
            </div>

            {/* Action buttons */}
            <div className="flex space-x-2.5 pt-3">
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all backdrop-blur-sm border border-white/20"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] bg-gradient-to-r from-blue-500/25 to-purple-500/25 hover:from-blue-500/35 hover:to-purple-500/35 disabled:from-blue-500/15 disabled:to-purple-500/15 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all backdrop-blur-sm border border-white/20"
              >
                {loading
                  ? "Saving..."
                  : hasOptionalData
                  ? "Submit"
                  : "Skip & Submit"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Loader */}
      <ModalLoader isVisible={loading} message="Setting up your profile..." />
    </div>
  );
}
