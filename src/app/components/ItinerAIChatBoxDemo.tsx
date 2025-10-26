"use client";

import React, { useState } from "react";
import ItinerAIChatBox from "./ItinerAIChatBox";

/**
 * Demo component showing different ways to use ItinerAIChatBox
 * This demonstrates the reusable nature of the chat component
 */
export default function ItinerAIChatBoxDemo() {
  const [defaultInput, setDefaultInput] = useState("");
  const [whiteInput, setWhiteInput] = useState("");
  const [purpleInput, setPurpleInput] = useState("");
  const [customInput, setCustomInput] = useState("");

  const handleSubmit = (theme: string) => (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`${theme} theme submitted`);
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center text-gray-900">
        ItinerAI ChatBox Demo
      </h1>

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Default Theme */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Default Theme</h2>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <ItinerAIChatBox
              value={defaultInput}
              onChange={setDefaultInput}
              onSubmit={handleSubmit("default")}
              placeholder="Ask ItinerAI (Default Theme)"
              theme="default"
              inputType="input"
            />
          </div>
        </section>

        {/* White Theme */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">White Theme</h2>
          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-sm">
            <ItinerAIChatBox
              value={whiteInput}
              onChange={setWhiteInput}
              onSubmit={handleSubmit("white")}
              placeholder="Ask ItinerAI (White Theme)"
              theme="white"
              inputType="input"
            />
          </div>
        </section>

        {/* Purple Theme */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Purple Theme</h2>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg shadow-sm">
            <ItinerAIChatBox
              value={purpleInput}
              onChange={setPurpleInput}
              onSubmit={handleSubmit("purple")}
              placeholder="Ask ItinerAI (Purple Theme)"
              theme="purple"
              inputType="input"
            />
          </div>
        </section>

        {/* Textarea Example */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Textarea Input
          </h2>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <ItinerAIChatBox
              value={customInput}
              onChange={setCustomInput}
              onSubmit={handleSubmit("textarea")}
              placeholder="Ask ItinerAI (Textarea for longer messages)"
              theme="default"
              inputType="textarea"
            />
          </div>
        </section>

        {/* Custom Positioning Examples */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Custom Positioning
          </h2>

          {/* Fixed Bottom Right */}
          <div className="relative bg-white p-6 rounded-lg shadow-sm h-64">
            <p className="text-gray-600 mb-4">
              Fixed bottom-right positioning:
            </p>
            <div className="absolute bottom-4 right-4">
              <ItinerAIChatBox
                value=""
                onChange={() => {}}
                onSubmit={handleSubmit("bottom-right")}
                placeholder="Bottom Right"
                theme="white"
                inputType="input"
                containerStyle={{ margin: 0 }}
              />
            </div>
          </div>

          {/* Centered */}
          <div className="relative bg-gray-100 p-6 rounded-lg shadow-sm h-64 flex items-center justify-center">
            <div>
              <p className="text-gray-600 mb-4 text-center">
                Centered positioning:
              </p>
              <ItinerAIChatBox
                value=""
                onChange={() => {}}
                onSubmit={handleSubmit("centered")}
                placeholder="Centered Chat"
                theme="purple"
                inputType="input"
              />
            </div>
          </div>

          {/* Full Width */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <p className="text-gray-600 mb-4">
              Full width with custom styling:
            </p>
            <ItinerAIChatBox
              value=""
              onChange={() => {}}
              onSubmit={handleSubmit("full-width")}
              placeholder="Full Width Chat"
              theme="default"
              inputType="input"
              containerStyle={{ width: "100%", maxWidth: "100%" }}
            />
          </div>
        </section>

        {/* Usage Instructions */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Usage Instructions
          </h2>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="prose max-w-none">
              <h3 className="text-lg font-medium text-gray-900">
                How to Use ItinerAIChatBox
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>
                  Import the component:{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    import ItinerAIChatBox from "./ItinerAIChatBox";
                  </code>
                </li>
                <li>
                  Add state for the input value:{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    const [input, setInput] = useState("");
                  </code>
                </li>
                <li>
                  Create a submit handler:{" "}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    const handleSubmit = (e) =&gt; {`{/* handle submission */}`}
                    ;
                  </code>
                </li>
                <li>
                  Use the component with your preferred theme and settings
                </li>
              </ol>

              <h4 className="text-md font-medium text-gray-900 mt-4">
                Available Props:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>
                  <strong>value</strong>: Current input value (required)
                </li>
                <li>
                  <strong>onChange</strong>: Input change handler (required)
                </li>
                <li>
                  <strong>onSubmit</strong>: Form submit handler (required)
                </li>
                <li>
                  <strong>theme</strong>: "default" | "white" | "purple"
                  (optional, default: "default")
                </li>
                <li>
                  <strong>inputType</strong>: "input" | "textarea" (optional,
                  default: "input")
                </li>
                <li>
                  <strong>placeholder</strong>: Input placeholder text
                  (optional, default: "Ask ItinerAI")
                </li>
                <li>
                  <strong>disabled</strong>: Disable the input (optional,
                  default: false)
                </li>
                <li>
                  <strong>isLoading</strong>: Show loading state (optional,
                  default: false)
                </li>
                <li>
                  <strong>containerStyle</strong>: Custom styles for the
                  container (optional)
                </li>
                <li>
                  <strong>style</strong>: Custom styles for the input (optional)
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
