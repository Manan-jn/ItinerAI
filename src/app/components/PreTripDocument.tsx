"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1F2937",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 4,
    color: "#6B7280",
    textAlign: "center",
  },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: "#9333EA",
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
    color: "#1F2937",
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
    color: "#4B5563",
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 8,
    color: "#1F2937",
    textAlign: "justify",
  },
  listItem: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 4,
    marginLeft: 16,
    color: "#374151",
  },
  bold: {
    fontWeight: "bold",
  },
  header: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#1F2937",
  },
  contactBox: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    marginBottom: 12,
    borderRadius: 4,
  },
  contactText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#374151",
  },
  warningBox: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    marginBottom: 12,
    borderRadius: 4,
  },
  warningText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#92400E",
  },
  safetyRating: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
  },
  safetyLow: {
    color: "#059669",
  },
  safetyMedium: {
    color: "#D97706",
  },
  safetyHigh: {
    color: "#DC2626",
  },
});

interface PreTripDocumentProps {
  markdownContent: string;
}

// Function to parse markdown and convert to PDF elements
const parseMarkdown = (markdown: string) => {
  const lines = markdown.split("\\n");
  const elements: React.ReactElement[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (!line.trim()) continue;

    // Main title (# )
    if (line.startsWith("# ")) {
      elements.push(
        <Text key={key++} style={styles.title}>
          {line.replace("# ", "")}
        </Text>
      );
    }
    // Section title (## )
    else if (line.startsWith("## ")) {
      elements.push(
        <Text key={key++} style={styles.sectionTitle}>
          {line.replace("## ", "")}
        </Text>
      );
    }
    // Subsection title (### )
    else if (line.startsWith("### ")) {
      elements.push(
        <Text key={key++} style={styles.subsectionTitle}>
          {line.replace("### ", "")}
        </Text>
      );
    }
    // Divider (---)
    else if (line.trim() === "---") {
      elements.push(<View key={key++} style={styles.divider} />);
    }
    // Bold text (**text**)
    else if (line.startsWith("**") && line.includes(":**")) {
      const text = line.replace(/\*\*/g, "");
      elements.push(
        <Text key={key++} style={[styles.paragraph, styles.bold]}>
          {text}
        </Text>
      );
    }
    // List items (- )
    else if (line.trim().startsWith("- ")) {
      elements.push(
        <Text key={key++} style={styles.listItem}>
          • {line.trim().replace("- ", "")}
        </Text>
      );
    }
    // Regular paragraph
    else {
      elements.push(
        <Text key={key++} style={styles.paragraph}>
          {line}
        </Text>
      );
    }
  }

  return elements;
};

export default function PreTripDocument({
  markdownContent,
}: PreTripDocumentProps) {
  const elements = parseMarkdown(markdownContent);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {elements}
      </Page>
    </Document>
  );
}
