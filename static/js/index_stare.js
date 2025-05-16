$(document).ready(function() {
  const options = {
    slidesToScroll: 1,
    slidesToShow: 1,
    loop: true,
    infinite: true,
    autoplay: false,
    autoplaySpeed: 3000,
  };
  // Ensure you have elements with class 'carousel' if you keep this part.
  // const carousels = bulmaCarousel.attach('.carousel', options); 
});

document.addEventListener('DOMContentLoaded', function() {
  loadTableData();
  setupEventListeners();
  window.addEventListener('resize', adjustNameColumnWidth);
});

function loadTableData() {
  console.log('Starting to load table data...');
  // *** IMPORTANT: Update this path to your NEW JSON data file ***
  fetch('./stare_leaderboard.json') 
    .then(response => {
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Data loaded successfully:', data);
      const tbody = document.querySelector('#leaderboard-table tbody'); // Ensure your table ID matches
      if (!tbody) {
        console.error('Table body not found! Check your HTML table ID.');
        return;
      }
      tbody.innerHTML = ''; // Clear existing rows

      // Prepare scores for styling based on new structure
      const stareScores = prepareScoresForStyling(data.leaderboardData, 'stare');
      const stareVisimScores = prepareScoresForStyling(data.leaderboardData, 'stare-visim');

      data.leaderboardData.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.classList.add(row.info.type || 'unknown');

        const nameCell = (row.info.link && row.info.link.trim() !== '')
          ? `<a href="${row.info.link}" target="_blank"><b>${row.info.name}</b></a>`
          : `<b>${row.info.name}</b>`;

        // CoT Symbol removed

        const safeGet = (obj, path, defaultValue = '-') => {
          // Adjusted safeGet to handle potentially undefined paths more gracefully
          const value = path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : undefined, obj);
          return value !== undefined ? value : defaultValue;
        };
        
        const formatValueWithStyle = (value, scoresArray, itemIndex, category) => {
          if (scoresArray && scoresArray[category] && scoresArray[category][itemIndex] !== undefined) {
            return applyStyle(value, scoresArray[category][itemIndex]);
          }
          return value || '-';
        };

        tr.innerHTML = `
          <td>${nameCell}</td>
          <td>${row.info.size || '-'}</td>
          <td class="stare-overall">${formatValueWithStyle(safeGet(row, 'stare.overall'), stareScores, index, 'overall')}</td>
          <td class="hidden stare-details">${formatValueWithStyle(safeGet(row, 'stare.2D_trans'), stareScores, index, '2D_trans')}</td>
          <td class="hidden stare-details">${formatValueWithStyle(safeGet(row, 'stare.3D_trans'), stareScores, index, '3D_trans')}</td>
          <td class="hidden stare-details">${formatValueWithStyle(safeGet(row, 'stare.cube_net'), stareScores, index, 'cube_net')}</td>
          <td class="hidden stare-details">${formatValueWithStyle(safeGet(row, 'stare.tangram'), stareScores, index, 'tangram')}</td>
          <td class="hidden stare-details">${formatValueWithStyle(safeGet(row, 'stare.temporal'), stareScores, index, 'temporal')}</td>
          <td class="hidden stare-details">${formatValueWithStyle(safeGet(row, 'stare.perspective'), stareScores, index, 'perspective')}</td>

          
          <td class="stare-visim-overall">${formatValueWithStyle(safeGet(row, 'stare-visim.overall'), stareVisimScores, index, 'overall')}</td>
          <td class="hidden stare-visim-details">${formatValueWithStyle(safeGet(row, 'stare-visim.2D_trans'), stareVisimScores, index, '2D_trans')}</td>
          <td class="hidden stare-visim-details">${formatValueWithStyle(safeGet(row, 'stare-visim.3D_trans'), stareVisimScores, index, '3D_trans')}</td>
          <td class="hidden stare-visim-details">${formatValueWithStyle(safeGet(row, 'stare-visim.cube_net'), stareVisimScores, index, 'cube_net')}</td>
          <td class="hidden stare-visim-details">${formatValueWithStyle(safeGet(row, 'stare-visim.tangram'), stareVisimScores, index, 'tangram')}</td>
          <td class="hidden stare-visim-details">${formatValueWithStyle(safeGet(row, 'stare-visim.temporal'), stareVisimScores, index, 'temporal')}</td>
          <td class="hidden stare-visim-details">${formatValueWithStyle(safeGet(row, 'stare-visim.perspective'), stareVisimScores, index, 'perspective')}</td>
        `;
        tbody.appendChild(tr);
      });

      setTimeout(adjustNameColumnWidth, 0);
      initializeSorting();
    })
    .catch(error => {
      console.error('Error loading table data:', error);
      const tbody = document.querySelector('#leaderboard-table tbody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="15"> 
              Error loading data: ${error.message}<br>
              Please ensure your JSON file is correctly named, located, and formatted, and that you're accessing this page through a web server if fetching locally.
            </td>
          </tr>
        `;
      }
    });
}

function setupEventListeners() {
  document.querySelector('.reset-cell').addEventListener('click', function() {
    resetTable();
  });

  document.querySelector('.stare-details-cell').addEventListener('click', function() {
    toggleDetails('stare');
  });

  document.querySelector('.stare-visim-details-cell').addEventListener('click', function() {
    toggleDetails('stare-visim');
  });

  const headers = document.querySelectorAll('#leaderboard-table thead tr:last-child th.sortable');
  headers.forEach(header => {
    header.addEventListener('click', function() {
      sortTable(this);
    });
  });
}

function toggleDetails(section) {
  const sections = ['stare', 'stare-visim'];
  sections.forEach(sec => {
    const detailCells = document.querySelectorAll('.' + sec + '-details');
    const overallCell = document.querySelector('.' + sec + '-overall'); // Overall is a single cell now
    const headerCell = document.querySelector('.' + sec + '-details-cell');
    
    if (sec === section) {
      detailCells.forEach(cell => cell.classList.toggle('hidden'));
      // Overall cell visibility is handled by the colspan logic if it were to be hidden.
      // For now, overall is always visible, and details toggle.
      const currentColspan = headerCell.getAttribute('colspan');
      // New logic: STARE/STARE-VisIm has 1 overall + 6 detail columns = 7 total if expanded
      headerCell.setAttribute('colspan', currentColspan === '1' ? '7' : '1');
    } else {
      detailCells.forEach(cell => cell.classList.add('hidden'));
      // overallCells.forEach(cell => cell.classList.remove('hidden')); // Overall cells are always visible
      document.querySelector('.' + sec + '-details-cell').setAttribute('colspan', '1');
    }
  });

  setTimeout(adjustNameColumnWidth, 0);
}

function resetTable() {
  document.querySelectorAll('.stare-details, .stare-visim-details').forEach(function(cell) {
    cell.classList.add('hidden');
  });

  document.querySelectorAll('.stare-overall, .stare-visim-overall').forEach(function(cell) {
    cell.classList.remove('hidden'); // These should always be visible
  });

  document.querySelector('.stare-details-cell').setAttribute('colspan', '1');
  document.querySelector('.stare-visim-details-cell').setAttribute('colspan', '1');

  // Default sort by STARE-VisIm Overall
  const stareVisimOverallHeader = document.querySelector('#leaderboard-table thead tr:last-child th.stare-visim-overall');
  if (stareVisimOverallHeader) {
    sortTable(stareVisimOverallHeader, true);
  } else {
    console.warn('STARE-VisIm overall header not found for default sorting.');
  }
  

  setTimeout(adjustNameColumnWidth, 0);
}

function sortTable(header, forceDescending = false, maintainOrder = false) {
  const table = document.getElementById('leaderboard-table');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  const headers = Array.from(header.parentNode.children);
  const columnIndex = headers.indexOf(header);
  const sortType = header.dataset.sort;

  const isDescending = forceDescending ||
    (!header.classList.contains('asc') && !header.classList.contains('desc')) ||
    header.classList.contains('asc');

  if (!maintainOrder) {
    rows.sort((a, b) => {
      let aValue = getCellValue(a, columnIndex);
      let bValue = getCellValue(b, columnIndex);

      // Handle '-' values to sort them to the bottom
      const aIsDash = aValue === '-';
      const bIsDash = bValue === '-';

      if (aIsDash && bIsDash) return 0;
      if (aIsDash) return 1; // a comes after b
      if (bIsDash) return -1; // b comes after a

      if (sortType === 'number') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
        return isDescending ? (bValue - aValue) : (aValue - bValue);
      } else if (sortType === 'date') { // Kept for completeness, not used by current data
        return isDescending
          ? new Date(bValue) - new Date(aValue)
          : new Date(aValue) - new Date(bValue);
      } else { // string
        return isDescending
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }
    });
  }

  headers.forEach(th => th.classList.remove('asc', 'desc'));
  header.classList.add(isDescending ? 'desc' : 'asc');
  rows.forEach(row => tbody.appendChild(row));
  setTimeout(adjustNameColumnWidth, 0);
}

function getCellValue(row, index) {
  const cells = Array.from(row.children);
  let cell = cells[index];
  // This part of getCellValue might need review if complex column hiding/showing logic is added.
  // For the current setup where overall is always shown and details toggle, direct indexing should work.
  return cell ? cell.textContent.trim() : '';
}

function initializeSorting() {
  // Default sort by STARE-VisIm Overall, descending
  const stareVisimOverallHeader = document.querySelector('#leaderboard-table thead tr:last-child th.stare-visim-overall');
   if (stareVisimOverallHeader) {
    sortTable(stareVisimOverallHeader, true);
  } else {
    console.warn('STARE-VisIm overall header not found for initial sorting.');
     // Fallback: try sorting by the first sortable column if the preferred one isn't found
    const firstSortableHeader = document.querySelector('#leaderboard-table thead tr:last-child th.sortable');
    if (firstSortableHeader) {
      sortTable(firstSortableHeader, true);
    }
  }
}

function adjustNameColumnWidth() {
  const nameColumn = document.querySelectorAll('#leaderboard-table td:first-child, #leaderboard-table th:first-child');
  let maxWidth = 0;

  const span = document.createElement('span');
  span.style.visibility = 'hidden';
  span.style.position = 'absolute';
  span.style.whiteSpace = 'nowrap'; // Ensure text doesn't wrap when measuring
  document.body.appendChild(span);

  nameColumn.forEach(cell => {
    // Use innerHTML for cells that might contain links/bold tags for more accurate width
    span.innerHTML = cell.innerHTML; 
    const width = span.offsetWidth;
    if (width > maxWidth) {
      maxWidth = width;
    }
  });

  document.body.removeChild(span);
  maxWidth += 20; // Add some padding

  nameColumn.forEach(cell => {
    cell.style.width = `${maxWidth}px`;
    cell.style.minWidth = `${maxWidth}px`;
    cell.style.maxWidth = `${maxWidth}px`; // Prevent shrinking/expanding too much
  });
}

function prepareScoresForStyling(data, sectionKey) {
  const scores = {};
  // New fields based on the provided data structure
  const fields = ['overall', '2D_trans', '3D_trans', 'cube_net', 'tangram', 'temporal', 'perspective'];

  fields.forEach(field => {
    const values = data
      .map(row => row[sectionKey] && row[sectionKey][field])
      .filter(value => value !== '-' && value !== undefined && value !== null && !isNaN(parseFloat(value))) // Ensure valid numbers
      .map(value => parseFloat(value));

    if (values.length > 0) {
      const sortedValues = [...new Set(values)].sort((a, b) => b - a); // Sort descending
      scores[field] = data.map(row => {
        const valueStr = row[sectionKey] && row[sectionKey][field];
        if (valueStr === '-' || valueStr === undefined || valueStr === null || isNaN(parseFloat(valueStr))) {
          return -1; // Indicates not applicable or not a number
        }
        const valueNum = parseFloat(valueStr);
        const rank = sortedValues.indexOf(valueNum);
        return rank; // rank 0 is best, 1 is second best, etc.
      });
    } else {
      // If no valid values for a field, mark all as -1 (no styling rank)
      scores[field] = data.map(() => -1);
    }
  });
  return scores;
}

function applyStyle(value, rank) {
  if (value === undefined || value === null || value === '-') return '-';
  if (rank === 0) return `<b>${value}</b>`; // Best score
  if (rank === 1) return `<span style="text-decoration: underline;">${value}</span>`; // Second best
  return `${value}`; // Others
}