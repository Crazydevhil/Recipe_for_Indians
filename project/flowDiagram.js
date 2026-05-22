const container = document.getElementById('flowDiagramContainer');

const GROUP_COLORS = [
  { bg: '#ffe0b2', border: '#f57c00' }, // Orange
  { bg: '#c8e6c9', border: '#388e3c' }, // Green
  { bg: '#bbdefb', border: '#1976d2' }, // Blue
  { bg: '#f8bbd0', border: '#c2185b' }, // Pink
  { bg: '#e1bee7', border: '#7b1fa2' }  // Purple
];

window.renderFlowDiagram = (parallelProcesses, allSteps) => {
  container.innerHTML = '';

  if (!parallelProcesses || !Array.isArray(parallelProcesses) || parallelProcesses.length === 0) {
    renderSequentialFallback(allSteps);
    return;
  }

  try {
    let html = '<div class="flow-container">';

    const stepMap = {};
    if (allSteps && Array.isArray(allSteps)) {
      allSteps.forEach(step => {
        stepMap[step.step_number] = step;
      });
    }

    parallelProcesses.forEach((group, index) => {
      const color = GROUP_COLORS[index % GROUP_COLORS.length];

      html += `<div class="flow-group-wrapper">`;
      html += `<div class="flow-group-label">${group.label || 'Process Group ' + (index + 1)}</div>`;
      html += `<div class="flow-row">`;

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
         html += `
            <div class="flow-node" style="background-color: ${color.bg}; border-color: ${color.border};">
              <div class="flow-node-title">${group.label || 'Process'}</div>
            </div>
          `;
      }

      html += `</div>`; // end flow-row
      html += `</div>`; // end flow-group-wrapper

      if (index < parallelProcesses.length - 1) {
        html += `<div class="flow-connector">
                   <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M12 0L12 38" stroke="var(--saffron)" stroke-width="2" stroke-linecap="round"/>
                     <path d="M6 32L12 38L18 32" stroke="var(--saffron)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                   </svg>
                 </div>`;
      }
    });

    html += '</div>';
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

  let html = '<div class="flow-container">';
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
        html += `<div class="flow-connector">
                   <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M12 0L12 38" stroke="var(--saffron)" stroke-width="2" stroke-linecap="round"/>
                     <path d="M6 32L12 38L18 32" stroke="var(--saffron)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                   </svg>
                 </div>`;
    }
  });
  html += '</div>';
  container.innerHTML = html;
}

function truncate(str, n) {
  return (str.length > n) ? str.slice(0, n - 1) + '...' : str;
}
