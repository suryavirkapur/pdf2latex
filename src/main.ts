import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import path from "path";

async function extractLatexFromPDF(inputPath, outputPath) {
  try {
    const anthropic = new Anthropic({
      apiKey: "fet",
    });

    // Read the PDF file
    console.log(`Reading PDF from ${inputPath}...`);
    const pdfBuffer = await fs.readFile(inputPath);
    const pdfBase64 = pdfBuffer.toString("base64");

    console.log("Sending request to Claude...");
    const response = await anthropic.beta.messages.create({
      model: "claude-3-5-sonnet-20241022",
      betas: ["pdfs-2024-09-25"],
      max_tokens: 1024,
      messages: [
        {
          content: [
            {
              type: "document",
              source: {
                media_type: "application/pdf",
                type: "base64",
                data: pdfBase64,
              },
            },
            {
              type: "text",
              text: "Please extract and return only the LaTeX content from this document. Do not include any library imports or page settings. Return only the core LaTeX content. Only look at page 1.",
            },
          ],
          role: "user",
        },
      ],
    });

    const latexContent = response.content[0].text;

    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    console.log(`Writing LaTeX content to ${outputPath}...`);
    await fs.writeFile(outputPath, latexContent, "utf-8");

    console.log("Extraction and save complete!");
    return latexContent;
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error("Usage: bun run src/main.ts <input-pdf> <output-tex>");
    process.exit(1);
  }

  const [inputPath, outputPath] = args;

  try {
    // Validate input file exists
    await fs.access(inputPath);

    await extractLatexFromPDF(inputPath, outputPath);
    console.log("\nSuccess! Check your output file for the extracted LaTeX content.");
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error(`Error: Input file '${inputPath}' does not exist.`);
    } else {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

// Run the script
main();
