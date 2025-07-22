# RedScan Lite

A simple LLM-powered chat API server designed for testing with Promptfoo.

## Getting Started

### Prerequisites

- Git
- Node.js v20 or higher
- npm (comes with Node.js)
- [Promptfoo CLI](https://www.promptfoo.dev/docs/getting-started) - Install with: `npm install -g promptfoo`

### Download the Code

**Option 1: Using Git** (recommended)

```bash
git clone https://github.com/promptfoo/redscan-lite.git
cd redscan-lite
```

**Option 2: Download ZIP**

1. Go to https://github.com/promptfoo/redscan-lite
2. Click the green "Code" button
3. Select "Download ZIP"
4. Extract the ZIP file and open the folder

### Install dependencies

```sh
pip install -r requirements.txt
npm install
```

### Optional: Enable AI responses

```sh
export OPENAI_API_KEY=your-key-here
```

## Testing with Promptfoo

The included `promptfooconfig.yaml` tests against a public demo API:

```bash
promptfoo eval
```