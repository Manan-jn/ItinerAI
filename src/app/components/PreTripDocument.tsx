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
    padding: 30,
    backgroundColor: "#FFFFFF",
    fontFamily: "Helvetica",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#1E40AF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 9,
    marginBottom: 3,
    color: "#6B7280",
    textAlign: "center",
  },
  divider: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#3B82F6",
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 8,
    color: "#1E40AF",
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 6,
    color: "#3B82F6",
  },
  paragraph: {
    fontSize: 9,
    lineHeight: 1.5,
    marginBottom: 6,
    color: "#374151",
    textAlign: "justify",
  },
  listItem: {
    fontSize: 8.5,
    lineHeight: 1.4,
    marginBottom: 3,
    marginLeft: 12,
    paddingLeft: 8,
    color: "#4B5563",
  },
  nestedListItem: {
    fontSize: 8,
    lineHeight: 1.4,
    marginBottom: 2,
    marginLeft: 24,
    paddingLeft: 8,
    color: "#6B7280",
  },
  bold: {
    fontWeight: "bold",
    color: "#1F2937",
  },
  boldLabel: {
    fontWeight: "bold",
    fontSize: 9,
    color: "#1F2937",
    marginBottom: 4,
  },
  infoBox: {
    backgroundColor: "#F0F9FF",
    padding: 10,
    marginBottom: 8,
    marginTop: 4,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  warningBox: {
    backgroundColor: "#FEF3C7",
    padding: 10,
    marginBottom: 8,
    marginTop: 4,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  contactText: {
    fontSize: 8.5,
    lineHeight: 1.4,
    color: "#374151",
  },
});

interface PreTripDocumentProps {
  markdownContent: string;
}

// Helper function to parse inline bold text
const parseInlineFormatting = (
  text: string
): (string | { text: string; bold: boolean })[] => {
  const parts: (string | { text: string; bold: boolean })[] = [];
  const boldRegex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the bold
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // Add bold text
    parts.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};

// Function to render text with inline formatting
const renderFormattedText = (text: string, baseStyle: any, key: number) => {
  const parts = parseInlineFormatting(text);

  if (parts.length === 1 && typeof parts[0] === "string") {
    return (
      <Text key={key} style={baseStyle}>
        {text}
      </Text>
    );
  }

  return (
    <Text key={key} style={baseStyle}>
      {parts.map((part, idx) => {
        if (typeof part === "string") {
          return part;
        } else {
          return (
            <Text key={idx} style={styles.bold}>
              {part.text}
            </Text>
          );
        }
      })}
    </Text>
  );
};

// Function to parse markdown and convert to PDF elements
const parseMarkdown = (markdown: string) => {
  // FIX: Use actual newline character, not escaped string
  const lines = markdown.split("\n");
  const elements: React.ReactElement[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      // Add small spacing for empty lines between sections
      if (elements.length > 0) {
        elements.push(<View key={key++} style={{ height: 4 }} />);
      }
      continue;
    }

    // Main title (# )
    if (trimmedLine.startsWith("# ")) {
      const content = trimmedLine.replace("# ", "");
      elements.push(renderFormattedText(content, styles.title, key++));
    }
    // Section title (## )
    else if (trimmedLine.startsWith("## ")) {
      const content = trimmedLine.replace("## ", "");
      elements.push(renderFormattedText(content, styles.sectionTitle, key++));
    }
    // Subsection title (### )
    else if (trimmedLine.startsWith("### ")) {
      const content = trimmedLine.replace("### ", "");
      elements.push(
        renderFormattedText(content, styles.subsectionTitle, key++)
      );
    }
    // Divider (---)
    else if (trimmedLine === "---") {
      elements.push(<View key={key++} style={styles.divider} />);
    }
    // Nested list items (  - or    - with leading spaces)
    else if (/^\s{2,}- /.test(line)) {
      const content = line.replace(/^\s+- /, "");
      elements.push(
        <View key={key++} style={styles.nestedListItem}>
          {renderFormattedText(
            `  ◦ ${content}`,
            { fontSize: 8, color: "#6B7280" },
            0
          )}
        </View>
      );
    }
    // List items (- )
    else if (trimmedLine.startsWith("- ")) {
      const content = trimmedLine.replace("- ", "");
      elements.push(
        <View key={key++} style={styles.listItem}>
          {renderFormattedText(`• ${content}`, styles.listItem, 0)}
        </View>
      );
    }
    // Bold label lines (**Label:**)
    else if (trimmedLine.startsWith("**") && trimmedLine.includes(":**")) {
      const content = trimmedLine.replace(/\*\*/g, "");
      elements.push(
        <Text key={key++} style={styles.boldLabel}>
          {content}
        </Text>
      );
    }
    // Regular paragraph with potential inline formatting
    else {
      elements.push(renderFormattedText(trimmedLine, styles.paragraph, key++));
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
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.content}>{elements}</View>
      </Page>
    </Document>
  );
}
