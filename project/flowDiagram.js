const container = document.getElementById('flowDiagramContainer');

// Predefined colors for parallel groups
const GROUP_COLORS = [
  { bg: '#ffe0b2', border: '#f57c00' }, // Orange
  { bg: '#c8e6c9', border: '#388e3c' }, // Green
  { bg: '#bbdefb', border: '#1976d2' }, // Blue
  { bg: '#f8bbd0', border: '#c2185b' }, // Pink
  { bg: '#e1bee7', border: '#7b1fa2' }  // Purple
];

window.renderFlowDiagram = (parallelProcesses, allSteps) => {
  container.innerHTML = '';

  // Fallback to purely sequential if parallel_processes is empty, malformed, or missing
  if (!parallelProcesses || !Array.isArray(parallelProcesses) || parallelProcesses.length === 0) {
    renderSequentialFallback(allSteps);
    return;
  }

  try {
    let html = '';

    // Create a map for quick step lookup by step_number
    const stepMap = {};
    if (allSteps && Array.isArray(allSteps)) {
      allSteps.forEach(step => {
        stepMap[step.step_number] = step;
      });
    }

    parallelProcesses.forEach((group, index) => {
      const color = GROUP_COLORS[index % GROUP_COLORS.length];

      html += `<div class="flow-row">`;

      // If group is parallel (multiple separate threads running together)
      // Usually, Gemini might just put sequential things in one array.
      // We assume if steps are provided as an array of step numbers in "can_run_with" or similar,
      // they might be sub-groups. But based on the schema, steps is an array of step numbers.
      // Let's render the steps in this group side-by-side if they are parallel, or sequentially if they are a block.
      // For visual simplicity as requested: "Parallel steps sit side by side in the same row"

      if (Array.isArray(group.steps) && group.steps.length > 0) {
        group.steps.forEach(stepId => {
          const stepData = stepMap[stepId];
          const desc = stepData ? truncate(stepData.instruction, 50) : `Step ${stepId}`;

          html += `
            <div class="flow-node" style="background-color: ${color.bg}; border-color: ${color.border};">
              <div class="flow-node-title">Step ${stepId}</div>
              <div class="flow-node-desc">${desc}</div>
            </div>
          `;
        });
      } else {
        // Fallback for empty group
         html += `
            <div class="flow-node" style="background-color: ${color.bg}; border-color: ${color.border};">
              <div class="flow-node-title">${group.label || 'Process'}</div>
            </div>
          `;
      }

      html += `</div>`;

      // Add arrow connecting to the next row (if not the last row)
      if (index < parallelProcesses.length - 1) {
        html += `<div class="flow-arrow">↓</div>`;
      }
    });

    container.innerHTML = html;
  } catch (error) {
    console.error("Error rendering flow diagram, falling back to sequential:", error);
    renderSequentialFallback(allSteps);
  }
};

function renderSequentialFallback(allSteps) {
  if (!allSteps || !Array.isArray(allSteps) || allSteps.length === 0) {
    container.innerHTML = '<p>No flow data available.</p>';
    return;
  }

  let html = '';
  allSteps.forEach((step, index) => {
    html += `
      <div class="flow-row">
        <div class="flow-node" style="border-color: var(--saffron);">
          <div class="flow-node-title">Step ${step.step_number}</div>
          <div class="flow-node-desc">${truncate(step.instruction, 60)}</div>
        </div>
      </div>
    `;
    if (index < allSteps.length - 1) {
      html += `<div class="flow-arrow">↓</div>`;
    }
  });
  container.innerHTML = html;
}

function truncate(str, n) {
  return (str.length > n) ? str.slice(0, n - 1) + '...' : str;
}
