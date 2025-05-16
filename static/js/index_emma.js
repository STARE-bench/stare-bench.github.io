// index_stare.js

// If you still use the carousel elsewhere, keep this part; otherwise you can remove it.
$(document).ready(function() {
  const options = {
    slidesToScroll: 1,
    slidesToShow: 1,
    loop: true,
    infinite: true,
    autoplay: false,
    autoplaySpeed: 3000,
  };
  const carousels = bulmaCarousel.attach('.carousel', options);
});

document.addEventListener('DOMContentLoaded', function() {
  loadTableData();
  setupEventListeners();
  window.addEventListener('resize', adjustNameColumnWidth);
});

function loadTableData() {
  fetch('./stare_leaderboard.json')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      const tbody = document.querySelector('#stare-table tbody');

      const stareScores    = prepareScoresForStyling(data.leaderboardData, 'stare');
      const visimScores    = prepareScoresForStyling(data.leaderboardData, 'stare-visim');

      data.leaderboardData.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.classList.add(row.info.type || 'unknown');

        // Name + link
        const nameCell = row.info.link
          ? `<a href="${row.info.link}" target="_blank"><b>${row.info.name}</b></a>`
          : `<b>${row.info.name}</b>`;

        // CoT symbol
        // let cotSymbol = '-';
        // if (row.info.CoT === "true")  cotSymbol = '✓';
        // if (row.info.CoT === "false") cotSymbol = '✗';

        // Safe getter
        const safeGet = (obj, path) =>
          path.split('.').reduce((a, p) => a && a[p], obj) || '-';

        // Format overall (no author mark here, so just value)
        const fmt = (val) => val === '-' ? '-' : val;

        // Build row HTML
        tr.innerHTML = `
          <td>${nameCell}</td>
          <td>${row.info.size || '-'}</td>
          

          <!-- STARE overall + details -->
          <td class="stare-overall">
            ${applyStyle(fmt(safeGet(row, 'stare.overall')), stareScores.overall[idx])}
          </td>
          <td class="hidden stare-details">${applyStyle(safeGet(row, 'stare.2D_trans'), stareScores['2D_trans'][idx])}</td>
          <td class="hidden stare-details">${applyStyle(safeGet(row, 'stare.3D_trans'), stareScores['3D_trans'][idx])}</td>
          <td class="hidden stare-details">${applyStyle(safeGet(row, 'stare.cube_net'), stareScores['cube_net'][idx])}</td>
          <td class="hidden stare-details">${applyStyle(safeGet(row, 'stare.tangram'), stareScores['tangram'][idx])}</td>
          <td class="hidden stare-details">${applyStyle(safeGet(row, 'stare.temporal'), stareScores['temporal'][idx])}</td>
          <td class="hidden stare-details">${applyStyle(safeGet(row, 'stare.perspective'), stareScores['perspective'][idx])}</td>

          <!-- VisSim overall + details -->
          <td class="visim-overall">
            ${applyStyle(fmt(safeGet(row, 'stare-visim.overall')), visimScores.overall[idx])}
          </td>
          <td class="hidden visim-details">${applyStyle(safeGet(row, 'stare-visim.2D_trans'), visimScores['2D_trans'][idx])}</td>
          <td class="hidden visim-details">${applyStyle(safeGet(row, 'stare-visim.3D_trans'), visimScores['3D_trans'][idx])}</td>
          <td class="hidden visim-details">${applyStyle(safeGet(row, 'stare-visim.cube_net'), visimScores['cube_net'][idx])}</td>
          <td class="hidden visim-details">${applyStyle(safeGet(row, 'stare-visim.tangram'), visimScores['tangram'][idx])}</td>
          <td class="hidden visim-details">${applyStyle(safeGet(row, 'stare-visim.temporal'), visimScores['temporal'][idx])}</td>
          <td class="hidden visim-details">${applyStyle(safeGet(row, 'stare-visim.perspective'), visimScores['perspective'][idx])}</td>
        `;
        tbody.appendChild(tr);
      });

      setTimeout(adjustNameColumnWidth, 0);
      initializeSorting();
    })
    .catch(err => {
      console.error(err);
      document.querySelector('#stare-table tbody').innerHTML = `
        <tr><td colspan="16">
          Error loading data: ${err.message}<br>
          Make sure you're serving via HTTP (e.g. localhost) not file://
        </td></tr>`;
    });
}

function setupEventListeners() {
  document.querySelector('.reset-cell').addEventListener('click', resetTable);
  document.querySelector('.stare-details-cell').addEventListener('click', () => toggleDetails('stare'));
  document.querySelector('.visim-details-cell').addEventListener('click', () => toggleDetails('stare-visim'));
  document.querySelectorAll('#stare-table thead tr:last-child th.sortable')
    .forEach(th => th.addEventListener('click', () => sortTable(th)));
}

function toggleDetails(section) {
  const sections = ['stare','stare-visim'];
  sections.forEach(sec => {
    const detailCells  = document.querySelectorAll('.' + sec + '-details');
    const overallCells = document.querySelectorAll('.' + sec + '-overall');
    const headerCell   = document.querySelector('.' + sec + '-details-cell');
    if (sec === section) {
      detailCells.forEach(c => c.classList.toggle('hidden'));
      headerCell.setAttribute('colspan', headerCell.getAttribute('colspan')==='1' ? '7' : '1');
    } else {
      detailCells.forEach(c => c.classList.add('hidden'));
      overallCells.forEach(c => c.classList.remove('hidden'));
      document.querySelector('.' + sec + '-details-cell').setAttribute('colspan','1');
    }
  });
  setTimeout(adjustNameColumnWidth, 0);
}

function resetTable() {
  document.querySelectorAll('.stare-details, .visim-details').forEach(c => c.classList.add('hidden'));
  document.querySelectorAll('.stare-overall, .visim-overall').forEach(c => c.classList.remove('hidden'));
  document.querySelector('.stare-details-cell').setAttribute('colspan','1');
  document.querySelector('.visim-details-cell').setAttribute('colspan','1');
  const hdr = document.querySelector('#stare-table thead tr:last-child th.visim-overall');
  sortTable(hdr, true);
  setTimeout(adjustNameColumnWidth, 0);
}

function sortTable(header, forceDesc = false) {
  const table = document.getElementById('stare-table');
  const tbody = table.querySelector('tbody');
  const rows  = Array.from(tbody.querySelectorAll('tr'));
  const headers = Array.from(header.parentNode.children);
  const idx = headers.indexOf(header);
  const type = header.dataset.sort;
  const desc = forceDesc ||
               (!header.classList.contains('asc') && !header.classList.contains('desc')) ||
                header.classList.contains('asc');

  rows.sort((a,b) => {
    let aVal = getCellValue(a, idx), bVal = getCellValue(b, idx);
    if (aVal==='-' && bVal!=='-') return desc ? 1 : -1;
    if (bVal==='-' && aVal!=='-') return desc ? -1 : 1;
    if (type==='number') {
      return desc
        ? parseFloat(bVal) - parseFloat(aVal)
        : parseFloat(aVal) - parseFloat(bVal);
    }
    return desc
      ? bVal.localeCompare(aVal)
      : aVal.localeCompare(bVal);
  });

  header.parentNode.querySelectorAll('th').forEach(th => th.classList.remove('asc','desc'));
  header.classList.add(desc ? 'desc' : 'asc');
  rows.forEach(r => tbody.appendChild(r));
  setTimeout(adjustNameColumnWidth, 0);
}

function getCellValue(row, index) {
  const cells = Array.from(row.children);
  let cell = cells[index];
  if (cell && cell.classList.contains('hidden')) {
    if (cell.classList.contains('stare-details') || cell.classList.contains('stare-overall')) {
      cell = cells.find(c =>
        (c.classList.contains('stare-overall') || c.classList.contains('stare-details')) &&
         !c.classList.contains('hidden')
      );
    } else if (cell.classList.contains('visim-details') || cell.classList.contains('visim-overall')) {
      cell = cells.find(c =>
        (c.classList.contains('visim-overall') || c.classList.contains('visim-details')) &&
         !c.classList.contains('hidden')
      );
    }
  }
  return cell ? cell.textContent.trim() : '';
}

function initializeSorting() {
  const hdr = document.querySelector('#stare-table thead tr:last-child th.visim-overall');
  sortTable(hdr, true);
}

function adjustNameColumnWidth() {
  const nameCols = document.querySelectorAll('#stare-table td:first-child, #stare-table th:first-child');
  let maxW = 0;
  const span = document.createElement('span');
  span.style.visibility='hidden'; span.style.position='absolute'; span.style.whiteSpace='nowrap';
  document.body.appendChild(span);
  nameCols.forEach(c => {
    span.textContent = c.textContent;
    maxW = Math.max(maxW, span.offsetWidth);
  });
  document.body.removeChild(span);
  maxW += 20;
  nameCols.forEach(c => {
    c.style.minWidth = c.style.maxWidth = c.style.width = `${maxW}px`;
  });
}

function prepareScoresForStyling(data, section) {
  const scores = {};
  const fields = ['overall','2D_trans','3D_trans','cube_net','tangram','temporal','perspective'];
  fields.forEach(f => {
    const vals = data.map(r => r[section]?.[f])
                     .filter(v=>v!=='-'&&v!=null).map(parseFloat);
    const sorted = [...new Set(vals)].sort((a,b)=>b-a);
    scores[f] = data.map(r => {
      const v = r[section]?.[f];
      return v==null||v==='-' ? -1 : sorted.indexOf(parseFloat(v));
    });
  });
  return scores;
}

function applyStyle(val, rank) {
  if (val=='-'||val==null) return '-';
  if (rank===0) return `<b>${val}</b>`;
  if (rank===1) return `<span style="text-decoration:underline;">${val}</span>`;
  return val;
}
