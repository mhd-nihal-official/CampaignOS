import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof pdfWorkerUrl === 'string') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface ExtractedDocumentResult {
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt';
  text: string;
  characterCount: number;
}

export interface ParsedBriefFields {
  clientName?: string;
  industry?: string;
  businessDescription?: string;
  website?: string;
  campaignTitle?: string;
  objective?: string;
  productOrService?: string;
  targetAudience?: string;
  targetLocation?: string;
  launchDate?: string;
  endDate?: string;
  channels?: string[];
  budget?: string;
  keyMessage?: string;
  competitors?: string;
  notes?: string;
}

const KNOWN_CHANNELS = [
  'LinkedIn',
  'YouTube',
  'Instagram',
  'Email',
  'Paid Search',
  'Display',
  'Events',
  'TikTok',
  'SEO',
  'PR',
];

function getFileExtension(name: string): string {
  const parts = name.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

export async function extractBriefDocumentText(
  file: File
): Promise<ExtractedDocumentResult> {
  const ext = getFileExtension(file.name);

  if (ext === 'txt' || file.type === 'text/plain') {
    let text = '';
    try {
      text = (await file.text()).trim();
    } catch {
      throw new Error(
        `Could not read "${file.name}". Please ensure the text file is valid UTF-8.`
      );
    }

    if (!text) {
      throw new Error(
        `The uploaded text file "${file.name}" is empty. No brief content could be extracted.`
      );
    }

    return {
      fileName: file.name,
      fileType: 'txt',
      text,
      characterCount: text.length,
    };
  }

  if (
    ext === 'docx' ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value.trim();
      if (!text) {
        throw new Error(
          `No readable text was found inside "${file.name}". Please verify the DOCX file contains text content.`
        );
      }
      return {
        fileName: file.name,
        fileType: 'docx',
        text,
        characterCount: text.length,
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes('No readable text')) {
        throw err;
      }
      throw new Error(
        `Failed to parse DOCX file "${file.name}". The file may be corrupted or not a valid .docx archive.`
      );
    }
  }

  if (ext === 'pdf' || file.type === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const pageTexts: string[] = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const lines: string[] = [];
        let currentLine = '';
        let lastY: number | null = null;

        for (const item of content.items) {
          if (!('str' in item)) continue;
          const str = item.str;
          const transformY = Array.isArray(item.transform)
            ? item.transform[5]
            : null;

          if (
            lastY !== null &&
            transformY !== null &&
            Math.abs(transformY - lastY) > 4
          ) {
            if (currentLine.trim()) {
              lines.push(currentLine.trim());
            }
            currentLine = str;
          } else {
            currentLine = currentLine ? `${currentLine} ${str}` : str;
          }
          if (transformY !== null) {
            lastY = transformY;
          }
        }

        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }

        if (lines.length > 0) {
          pageTexts.push(lines.join('\n'));
        }
      }

      const text = pageTexts.join('\n\n').trim();
      if (!text) {
        throw new Error(
          `No selectable text could be extracted from "${file.name}". The PDF may be scanned or image-only.`
        );
      }

      return {
        fileName: file.name,
        fileType: 'pdf',
        text,
        characterCount: text.length,
      };
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes('No selectable text could be extracted')
      ) {
        throw err;
      }
      throw new Error(
        `Failed to extract text from PDF "${file.name}". It may be encrypted, password-protected, or malformed.`
      );
    }
  }

  throw new Error(
    `Unsupported file format "${file.name}". Only PDF (.pdf), Word (.docx), and plain text (.txt) files are supported.`
  );
}

const LABEL_MAP: Array<{
  field: keyof ParsedBriefFields;
  label: string;
  patterns: RegExp[];
}> = [
  {
    field: 'clientName',
    label: 'Client/Brand Name',
    patterns: [/^client(?:\s*\/\s*brand)?(?:\s+name)?\s*[:\-]\s*(.+)$/i, /^brand(?:\s+name)?\s*[:\-]\s*(.+)$/i],
  },
  {
    field: 'industry',
    label: 'Industry',
    patterns: [/^industry(?:\s*\/\s*sector)?\s*[:\-]\s*(.+)$/i, /^sector\s*[:\-]\s*(.+)$/i],
  },
  {
    field: 'businessDescription',
    label: 'Business Description',
    patterns: [/^business\s+description\s*[:\-]\s*(.+)$/i, /^about\s+(?:the\s+)?(?:client|company|business)\s*[:\-]\s*(.+)$/i],
  },
  {
    field: 'website',
    label: 'Website',
    patterns: [/^website(?:\s+url)?\s*[:\-]\s*(.+)$/i, /^url\s*[:\-]\s*(.+)$/i],
  },
  {
    field: 'campaignTitle',
    label: 'Campaign Name',
    patterns: [/^campaign(?:\s+name|\s+title)?\s*[:\-]\s*(.+)$/i, /^project(?:\s+name)?\s*[:\-]\s*(.+)$/i],
  },
  {
    field: 'objective',
    label: 'Campaign Objective',
    patterns: [/^(?:campaign\s+)?objectives?\s*[:\-]\s*(.+)$/i, /^goals?\s*[:\-]\s*(.+)$/i],
  },
  {
    field: 'productOrService',
    label: 'Product or Service',
    patterns: [/^product(?:\s+or\s+service)?(?:\s+being\s+promoted)?\s*[:\-]\s*(.+)$/i, /^service\s*[:\-]\s*(.+)$/i, /^offering\s*[:\-]\s*(.+)$/i],
  },
  {
    field: 'targetAudience',
    label: 'Target Audience',
    patterns: [/^(?:target\s+)?audience\s*[:\-]\s*(.+)$/i, /^audience\s+segment\s*[:\-]\s*(.+)$/i],
  },
  {
    field: 'targetLocation',
    label: 'Target Location/Market',
    patterns: [/^(?:target\s+)?(?:location|market|geography|region)(?:\s*\/\s*market)?\s*[:\-]\s*(.+)$/i],
  },
  {
    field: 'launchDate',
    label: 'Campaign Start Date',
    patterns: [/^(?:campaign\s+)?(?:start|launch)\s+date\s*[:\-]\s*(.+)$/i],
  },
  {
    field: 'endDate',
    label: 'Campaign End Date',
    patterns: [/^(?:campaign\s+)?end\s+date\s*[:\-]\s*(.+)$/i],
  },
  {
    field: 'budget',
    label: 'Budget',
    patterns: [/^(?:campaign\s+)?budget\s*[:\-]\s*(.+)$/i],
  },
  {
    field: 'keyMessage',
    label: 'Key Message',
    patterns: [/^(?:key|core)\s+messag(?:e|ing)\s*[:\-]\s*(.+)$/i, /^value\s+proposition\s*[:\-]\s*(.+)$/i],
  },
  {
    field: 'competitors',
    label: 'Competitors',
    patterns: [/^competitors?\s*[:\-]\s*(.+)$/i],
  },
  {
    field: 'channels',
    label: 'Marketing Channels',
    patterns: [/^(?:marketing\s+)?channels?\s*[:\-]\s*(.+)$/i],
  },
  {
    field: 'notes',
    label: 'Additional Requirements',
    patterns: [/^(?:additional\s+)?(?:requirements|notes|constraints)\s*[:\-]\s*(.+)$/i],
  },
];

function normalizeIsoDate(raw: string): string | undefined {
  const isoMatch = raw.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) return isoMatch[1];
  const parsed = Date.parse(raw.trim());
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }
  return undefined;
}

/**
 * Deterministically extracts only explicitly labeled fields from brief text.
 * Never fabricates or guesses missing client or campaign data.
 */
export function parseBriefTextToFields(rawText: string): {
  fields: ParsedBriefFields;
  matchedLabels: string[];
} {
  const fields: ParsedBriefFields = {};
  const matchedLabels: string[] = [];
  const lines = rawText.split(/\r?\n/);

  let activeField: keyof ParsedBriefFields | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      activeField = null;
      continue;
    }

    let matchedThisLine = false;
    for (const entry of LABEL_MAP) {
      for (const pattern of entry.patterns) {
        const match = line.match(pattern);
        if (match && match[1]?.trim()) {
          const val = match[1].trim();
          matchedThisLine = true;
          activeField = entry.field;

          if (entry.field === 'channels') {
            const foundChannels = KNOWN_CHANNELS.filter((ch) =>
              val.toLowerCase().includes(ch.toLowerCase())
            );
            if (foundChannels.length > 0) {
              fields.channels = foundChannels;
              if (!matchedLabels.includes(entry.label)) {
                matchedLabels.push(entry.label);
              }
            }
          } else if (entry.field === 'launchDate' || entry.field === 'endDate') {
            const iso = normalizeIsoDate(val);
            if (iso) {
              fields[entry.field] = iso;
              if (!matchedLabels.includes(entry.label)) {
                matchedLabels.push(entry.label);
              }
            }
          } else {
            fields[entry.field] = val;
            if (!matchedLabels.includes(entry.label)) {
              matchedLabels.push(entry.label);
            }
          }
          break;
        }
      }
      if (matchedThisLine) break;
    }

    // Append continuation lines for multiline text fields
    if (
      !matchedThisLine &&
      activeField &&
      activeField !== 'channels' &&
      activeField !== 'launchDate' &&
      activeField !== 'endDate'
    ) {
      const existing = fields[activeField];
      if (typeof existing === 'string') {
        fields[activeField] = `${existing} ${line}`;
      }
    }
  }

  return { fields, matchedLabels };
}
