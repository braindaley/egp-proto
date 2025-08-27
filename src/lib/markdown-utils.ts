export function parseSimpleMarkdown(text: string, options: { hideHeaders?: boolean } = {}): string {
  let result = text.trim();
  
  // Check if this is already HTML content (contains HTML tags)
  const isAlreadyHTML = /<[^>]+>/.test(result);
  
  if (isAlreadyHTML) {
    // Handle existing HTML content
    if (options.hideHeaders) {
      result = result.replace(/<h3[^>]*>.*?<\/h3>/gi, '');
    }
    
    // Clean up any extra whitespace and return as-is
    return result
      .replace(/\n\s*\n/g, '\n')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  }
  
  // Handle markdown content
  // First, handle headers - skip if hideHeaders is true
  if (!options.hideHeaders) {
    result = result.replace(/### (.*?)(?=\n|$)/g, '<h3 class="font-semibold text-lg mb-3 mt-0">$1</h3>');
  } else {
    result = result.replace(/### (.*?)(?=\n|$)/g, '');
  }
  
  // Convert bold text
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic text (but not bullet points with single asterisk)
  result = result.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
  
  // Split into blocks by double newlines but preserve consecutive list items
  const blocks = result.split(/\n\s*\n/);
  
  const processedBlocks: string[] = [];
  let currentListItems: string[] = [];
  
  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;
    
    // Check if this block contains list items (starts with * and spaces)
    if (/^\*\s+/.test(trimmedBlock)) {
      // Collect list items
      const items = trimmedBlock
        .split(/\n(?=\*\s+)/)
        .map(item => {
          // Remove the leading * and spaces, then wrap in li tags
          const content = item.replace(/^\*\s+/, '').trim();
          return `<li>${content}</li>`;
        });
      
      currentListItems.push(...items);
    } else {
      // If we have accumulated list items, wrap them in ul and add to blocks
      if (currentListItems.length > 0) {
        processedBlocks.push(`<ul class="list-disc pl-5 space-y-1 mb-4">${currentListItems.join('')}</ul>`);
        currentListItems = [];
      }
      
      // Check if this is a header (already processed)
      if (trimmedBlock.startsWith('<h3')) {
        processedBlocks.push(trimmedBlock);
      }
      // Otherwise, wrap in paragraph tags
      else {
        processedBlocks.push(`<p class="mb-4">${trimmedBlock}</p>`);
      }
    }
  }
  
  // Don't forget any remaining list items
  if (currentListItems.length > 0) {
    processedBlocks.push(`<ul class="list-disc pl-5 space-y-1 mb-4">${currentListItems.join('')}</ul>`);
  }
  
  return processedBlocks.join('');
}