"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import LoadingSpinner from "../components/LoadingSpinner";

interface UserData {
  dateOfBirth: string;
  gender: string;
  passportNationality: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  foodPreferences: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<UserData>>({});

  useEffect(() => {
    if (!currentUser) {
      router.push("/flights");
      return;
    }

    fetchUserData();
  }, [currentUser, router]);

  const fetchUserData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));

      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);
        setFormData(data);
      } else {
        setError("User profile not found. Please complete onboarding first.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to load user data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    if (!currentUser || !userData) return;

    try {
      setSaving(true);
      setError("");

      // Update the document in Firestore
      await updateDoc(doc(db, "users", currentUser.uid), {
        ...formData,
        updatedAt: new Date().toISOString(),
      });

      setUserData((prev) => ({ ...prev, ...formData } as UserData));
      setSuccess("Settings saved successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating user data:", error);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
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

  // Handle clicking outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showProfileDropdown &&
        !(e.target as Element).closest(".profile-dropdown")
      ) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showProfileDropdown]);

  if (loading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      {/* Navigation */}
      <nav className="relative z-10 backdrop-blur-md bg-black/20 border-b border-white/10">
        <div className="flex items-center justify-between py-4 px-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>

          <div className="flex items-center space-x-3">
            {/* Profile Dropdown */}
            <div className="relative profile-dropdown">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-sm font-medium text-white">
                      {currentUser?.displayName?.charAt(0) ||
                        currentUser?.email?.charAt(0) ||
                        "U"}
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-300 hidden sm:block">
                  {currentUser.displayName?.split(" ")[0] || currentUser.email}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    showProfileDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-64 backdrop-blur-xl bg-black/80 border border-white/20 rounded-xl shadow-2xl z-50">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                        {currentUser?.photoURL ? (
                          <img
                            src={currentUser.photoURL}
                            alt="Profile"
                            className="w-full h-full object-cover rounded-full"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-sm font-medium text-white">
                            {currentUser?.displayName?.charAt(0) ||
                              currentUser?.email?.charAt(0) ||
                              "U"}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {currentUser?.displayName || "User"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {currentUser?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        router.push("/flights");
                        setShowProfileDropdown(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      <span>Home</span>
                    </button>

                    <button
                      onClick={() => {
                        router.push(`/flights/${currentUser.uid}`);
                        setShowProfileDropdown(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      <span>Flights</span>
                    </button>

                    <div className="border-t border-white/10 my-2"></div>

                    <button
                      onClick={() => {
                        logout();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <div className="backdrop-blur-xl bg-black/30 border border-white/20 rounded-xl p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-light text-white mb-2">
              Profile Settings
            </h2>
            <p className="text-gray-400 text-sm">
              Manage your personal information and preferences
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-200 px-4 py-3 rounded-lg mb-6 text-sm">
              {success}
            </div>
          )}

          {userData && (
            <div className="space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth || ""}
                      onChange={(e) =>
                        handleInputChange("dateOfBirth", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 backdrop-blur-sm transition-all"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.gender || ""}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 backdrop-blur-sm transition-all"
                    >
                      <option value="" className="bg-gray-900">
                        Select gender
                      </option>
                      {genderOptions.map((option) => (
                        <option
                          key={option}
                          value={option}
                          className="bg-gray-900"
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Passport Nationality */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Passport Nationality
                    </label>
                    <select
                      value={formData.passportNationality || ""}
                      onChange={(e) =>
                        handleInputChange("passportNationality", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 backdrop-blur-sm transition-all"
                    >
                      <option value="" className="bg-gray-900">
                        Select country
                      </option>
                      {countries.map((country) => (
                        <option
                          key={country}
                          value={country}
                          className="bg-gray-900"
                        >
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Health & Preferences */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  Health & Preferences
                </h3>
                <div className="space-y-6">
                  {/* Allergies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Allergies
                    </label>
                    <textarea
                      value={formData.allergies || ""}
                      onChange={(e) =>
                        handleInputChange("allergies", e.target.value)
                      }
                      placeholder="Any food or environmental allergies"
                      rows={3}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 backdrop-blur-sm resize-none transition-all"
                    />
                  </div>

                  {/* Food Preferences */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Food Preferences
                    </label>
                    <select
                      value={formData.foodPreferences || ""}
                      onChange={(e) =>
                        handleInputChange("foodPreferences", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 backdrop-blur-sm transition-all"
                    >
                      <option value="" className="bg-gray-900">
                        Select preference
                      </option>
                      {foodPreferenceOptions.map((option) => (
                        <option
                          key={option}
                          value={option}
                          className="bg-gray-900"
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Emergency Contact Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContactName || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "emergencyContactName",
                          e.target.value
                        )
                      }
                      placeholder="Full name"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 backdrop-blur-sm transition-all"
                    />
                  </div>

                  {/* Emergency Contact Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyContactPhone || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "emergencyContactPhone",
                          e.target.value
                        )
                      }
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 backdrop-blur-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={currentUser.email || ""}
                      disabled
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Member Since
                    </label>
                    <input
                      type="text"
                      value={
                        userData.createdAt
                          ? new Date(userData.createdAt).toLocaleDateString()
                          : ""
                      }
                      disabled
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t border-white/10">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 disabled:from-blue-500/10 disabled:to-purple-500/10 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all backdrop-blur-sm border border-white/20 hover:border-white/30"
                >
                  {saving ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
