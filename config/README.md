# Configuration Directory

This directory contains all configuration files for the application.

## Files

### `config.json`
Main configuration file containing:
- **dataSource**: URL and type of the GeoJSON dataset
- **displaySettings**: UI settings, layer styling, tooltip configuration, and statistics
- **exampleQuestions**: Array of example questions shown in the chat interface

### `system-prompt.md`
The system prompt used by the AI assistant. This markdown file contains the instructions that define how the AI should behave and what it can help users with.

## Usage

To customize the application for a different dataset:

1. **Update `config.json`**:
   - Change `dataSource.url` to your GeoJSON dataset
   - Modify `displaySettings.title` and `description`
   - Update `tooltip.fields` to match your data properties
   - Adjust `stats.groupByFields` and `labels` for your data
   - Replace `exampleQuestions` with relevant questions

2. **Update `system-prompt.md`**:
   - Modify the AI's role and capabilities
   - Update domain-specific knowledge and terminology
   - Add context about your specific dataset

## Example

For a restaurant dataset, you might:
- Set `dataSource.url` to a restaurants GeoJSON file
- Change `title` to "Restaurant Finder"
- Update `tooltip.fields` to show restaurant name, cuisine type, rating
- Modify the system prompt to focus on food, dining, and restaurant recommendations