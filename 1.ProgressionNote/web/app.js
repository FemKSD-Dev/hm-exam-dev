async function checkServerStatus() {
  const loadingElement = document.getElementById('loading');
  const dataContainer = document.getElementById('data-container');

  try {
    const response = await fetch('http://localhost:3001/');
    if (!response.ok) {
      throw new Error('Server is not responding');
    }
    return true;
  } catch (error) {
    loadingElement.style.display = 'none';
  }
}

async function fetchData() {
  const apiUrl = 'http://localhost:3001/getVisitPicture?visitId=113333555555&formType=Progression note';
  const loadingElement = document.getElementById('loading');
  const dataContainer = document.getElementById('data-container');

  loadingElement.style.display = 'block';
  dataContainer.innerHTML = '';

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('Network response was not ok ' + response.statusText);
    const data = await response.json();

    if (data.code === 200) {
      displayData(data.data);
    } else {
      dataContainer.innerHTML = `<p>Error: ${data.text}</p>`;
    }
  } catch (error) {
    if (await checkServerStatus()) {
      dataContainer.innerHTML = `<p>Error: ${error.message}</p>`;
    } else {
      dataContainer.innerHTML = `<p style="color: red;">Error: Server is not running. Please start the server.</p>`;
    }
  } finally {
    loadingElement.style.display = 'none';
  }
}

function displayData(data) {
  const container = document.getElementById('data-container');
  container.innerHTML = '';

  // Filter out null fieldData
  const filteredData = data.filter(item => item.fieldData !== null);

  // Group by refId
  const groupedData = groupByRefId(filteredData);

  // Create table
  const table = document.createElement('table');
  table.innerHTML = `
      <thead>
          <tr>
              <th>RefId</th>
              <th>Active</th>
              <th>Field Type</th>
              <th>Field Data</th>
          </tr>
      </thead>
      <tbody></tbody>
  `;

  Object.keys(groupedData).forEach(refId => {
    groupedData[refId].forEach((item, index) => {
      const row = document.createElement('tr');

      if (index === 0) {
        const refIdCell = document.createElement('td');
        refIdCell.innerText = refId;
        refIdCell.rowSpan = groupedData[refId].length;
        row.appendChild(refIdCell);
      }

      const activeCell = document.createElement('td');
      activeCell.innerText = item.active || 'N/A';

      const fieldTypeCell = document.createElement('td');
      fieldTypeCell.innerText = item.fieldType;

      const fieldDataCell = document.createElement('td');
      fieldDataCell.innerText = item.fieldData;

      row.appendChild(activeCell);
      row.appendChild(fieldTypeCell);
      row.appendChild(fieldDataCell);
      table.querySelector('tbody').appendChild(row);
    });
  });

  container.appendChild(table);
}

function groupByRefId(data) {
  return data.reduce((grouped, item) => {
    if (!grouped[item.refId]) {
      grouped[item.refId] = [];
    }
    grouped[item.refId].push(item);
    return grouped;
  }, {});
}

function getRandomString() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const length = Math.floor(Math.random() * 10) + 5;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function getRandomFieldData() {
  return Math.random() < 0.5 ? getRandomString() : null;
}

function getRandomRefId() {
  return Math.floor(Math.random() * 1000000000000);
}

async function sendPostRequest(payload) {
  try {
    const response = await fetch('http://localhost:3001/saveVisitPicture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Failed to send data');
    }
    console.log('Data sent successfully');
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

async function generateData() {
  const loadingElement = document.getElementById('loading');
  const refId = getRandomRefId();

  loadingElement.style.display = 'block';

  const payload1 = {
    visitPictureList: [
      {
        pictureType: "Text",
        fieldType: "Note",
        fieldData: getRandomFieldData(),
        visitId: "113333555555",
        refId: refId.toString(),
        active: "Y",
        formType: "Progression note"
      }
    ],
    visitId: "113333555555",
    formType: "Progression note"
  };

  const payload2 = {
    visitPictureList: [
      {
        pictureType: "Text",
        fieldType: "O",
        fieldData: `O-${refId.toString()}`,
        visitId: "113333555555",
        refId: refId.toString(),
        active: "Y",
        formType: "Progression note"
      }
    ],
    visitId: "113333555555",
    formType: "Progression note"
  };

  try {
      sendPostRequest(payload2);
      sendPostRequest(payload1);
  } catch (error) {
    console.error('Error in API calls', error);
  } finally {
    loadingElement.style.display = 'none';
    fetchData();
  }
}

document.getElementById('reload-button').addEventListener('click', fetchData);
document.getElementById('gen-button').addEventListener('click', generateData);
document.addEventListener('DOMContentLoaded', fetchData);