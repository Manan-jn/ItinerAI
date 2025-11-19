"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";

interface MarkdownPDFDocumentProps {
  markdownContent: string;
  title?: string;
}

// Create comprehensive PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    lineHeight: 1.6,
  },
  // Headers
  h1: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 24,
    color: "#1e40af",
  },
  h2: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 20,
    color: "#1e40af",
  },
  h3: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 16,
    color: "#2563eb",
  },
  h4: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 12,
    color: "#3b82f6",
  },
  // Paragraph
  paragraph: {
    marginBottom: 12,
    textAlign: "justify",
    color: "#1f2937",
  },
  // List items
  listItem: {
    marginBottom: 6,
    marginLeft: 20,
    color: "#374151",
  },
  orderedListItem: {
    marginBottom: 6,
    marginLeft: 20,
    color: "#374151",
  },
  // Emphasis
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  // Links
  link: {
    color: "#2563eb",
    textDecoration: "underline",
  },
  // Code
  code: {
    fontFamily: "Courier",
    fontSize: 10,
    backgroundColor: "#f3f4f6",
    padding: 4,
    color: "#1f2937",
  },
  codeBlock: {
    fontFamily: "Courier",
    fontSize: 9,
    backgroundColor: "#f3f4f6",
    padding: 12,
    marginBottom: 12,
    marginTop: 8,
    color: "#1f2937",
    borderRadius: 4,
  },
  // Horizontal rule
  hr: {
    marginVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  // Blockquote
  blockquote: {
    marginLeft: 16,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#60a5fa",
    marginBottom: 12,
    fontStyle: "italic",
    color: "#4b5563",
  },
  // Section spacing
  section: {
    marginBottom: 8,
  },
});

// Simple markdown parser that converts markdown to PDF components
class MarkdownParser {
  private content: string;
  private position: number = 0;

  constructor(content: string) {
    this.content = content;
  }

  parse(): React.ReactElement[] {
    const elements: React.ReactElement[] = [];
    const lines = this.content.split("\n");
    let listCounter = 0;
    let inList = false;
    let listType: "ul" | "ol" | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        if (inList) {
          inList = false;
          listType = null;
          listCounter = 0;
        }
        continue;
      }

      // Headers
      if (trimmed.startsWith("# ")) {
        elements.push(
          <Text key={`h1-${i}`} style={styles.h1}>
            {trimmed.substring(2).trim()}
          </Text>
        );
      } else if (trimmed.startsWith("## ")) {
        elements.push(
          <Text key={`h2-${i}`} style={styles.h2}>
            {trimmed.substring(3).trim()}
          </Text>
        );
      } else if (trimmed.startsWith("### ")) {
        elements.push(
          <Text key={`h3-${i}`} style={styles.h3}>
            {trimmed.substring(4).trim()}
          </Text>
        );
      } else if (trimmed.startsWith("#### ")) {
        elements.push(
          <Text key={`h4-${i}`} style={styles.h4}>
            {trimmed.substring(5).trim()}
          </Text>
        );
      }
      // Horizontal rule
      else if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
        elements.push(<View key={`hr-${i}`} style={styles.hr} />);
      }
      // Unordered list
      else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        if (!inList || listType !== "ul") {
          inList = true;
          listType = "ul";
        }
        const content = trimmed.substring(2).trim();
        elements.push(
          <Text key={`li-${i}`} style={styles.listItem}>
            • {this.parseInline(content)}
          </Text>
        );
      }
      // Ordered list (simple detection: starts with number followed by dot)
      else if (/^\d+\.\s/.test(trimmed)) {
        if (!inList || listType !== "ol") {
          inList = true;
          listType = "ol";
          listCounter = 0;
        }
        listCounter++;
        const content = trimmed.replace(/^\d+\.\s/, "").trim();
        elements.push(
          <Text key={`ol-${i}`} style={styles.orderedListItem}>
            {listCounter}. {this.parseInline(content)}
          </Text>
        );
      }
      // Blockquote
      else if (trimmed.startsWith("> ")) {
        const content = trimmed.substring(2).trim();
        elements.push(
          <Text key={`quote-${i}`} style={styles.blockquote}>
            {this.parseInline(content)}
          </Text>
        );
      }
      // Code block (simple detection: starts with 4 spaces or tab)
      else if (line.startsWith("    ") || line.startsWith("\t")) {
        elements.push(
          <Text key={`code-${i}`} style={styles.codeBlock}>
            {line.trim()}
          </Text>
        );
      }
      // Regular paragraph
      else {
        if (inList) {
          inList = false;
          listType = null;
          listCounter = 0;
        }
        elements.push(
          <Text key={`p-${i}`} style={styles.paragraph}>
            {this.parseInline(trimmed)}
          </Text>
        );
      }
    }

    return elements;
  }

  // Parse inline formatting (bold, italic, links, code)
  parseInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let currentPos = 0;
    let key = 0;

    // Regular expressions for inline formatting
    const patterns = [
      { regex: /\*\*(.+?)\*\*/g, type: "bold" }, // **bold**
      { regex: /\*(.+?)\*/g, type: "italic" }, // *italic*
      { regex: /_(.+?)_/g, type: "italic" }, // _italic_
      { regex: /`(.+?)`/g, type: "code" }, // `code`
      { regex: /\[(.+?)\]\((.+?)\)/g, type: "link" }, // [text](url)
    ];

    // Find all matches
    const matches: Array<{
      index: number;
      length: number;
      content: string;
      type: string;
      url?: string;
    }> = [];

    for (const pattern of patterns) {
      const regex = new RegExp(pattern.regex);
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (pattern.type === "link") {
          matches.push({
            index: match.index,
            length: match[0].length,
            content: match[1],
            type: pattern.type,
            url: match[2],
          });
        } else {
          matches.push({
            index: match.index,
            length: match[0].length,
            content: match[1],
            type: pattern.type,
          });
        }
      }
    }

    // Sort matches by index
    matches.sort((a, b) => a.index - b.index);

    // Build the parts array
    for (const match of matches) {
      // Add text before match
      if (match.index > currentPos) {
        parts.push(text.substring(currentPos, match.index));
      }

      // Add formatted text
      switch (match.type) {
        case "bold":
          parts.push(
            <Text key={`bold-${key++}`} style={styles.bold}>
              {match.content}
            </Text>
          );
          break;
        case "italic":
          parts.push(
            <Text key={`italic-${key++}`} style={styles.italic}>
              {match.content}
            </Text>
          );
          break;
        case "code":
          parts.push(
            <Text key={`code-${key++}`} style={styles.code}>
              {match.content}
            </Text>
          );
          break;
        case "link":
          parts.push(
            <Link key={`link-${key++}`} style={styles.link} src={match.url!}>
              {match.content}
            </Link>
          );
          break;
      }

      currentPos = match.index + match.length;
    }

    // Add remaining text
    if (currentPos < text.length) {
      parts.push(text.substring(currentPos));
    }

    return parts.length > 0 ? parts : text;
  }
}

export default function MarkdownPDFDocument({
  markdownContent,
  title = "Pre-Trip Brief",
}: MarkdownPDFDocumentProps) {
  const parser = new MarkdownParser(markdownContent);
  const elements = parser.parse();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>{elements}</View>
      </Page>
    </Document>
  );
}
