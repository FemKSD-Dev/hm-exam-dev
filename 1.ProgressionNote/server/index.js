var express = require('express');
var cors = require('cors');
const mysql = require('mysql2/promise')

var app = express();
app.use(cors());
app.use(express.json());



app.get('/', (req, res) => {
  res.send('Welcome to HosMerge Exam.');
});

app.post('/saveVisitPicture', async (req, res) => {
  let data = req.body;
  let imagePath = `public/images/${data.formType}`;
  let visitPictureList = data.visitPictureList || [];
  let { visitId, formType, refId, fieldType } = data;
  let isHttpResponse = data.isHttpResponse !== false;

  const connection = await mysql.createConnection({
    host: '103.13.31.80',
    port: 3349,
    user: 'hm',
    password: 'Bankisahandsomeman@ssw0rd',
    database: 'hm_dev_t4'
  });

  try {
    if(visitPictureList.length === 0 ){
      let whereClause = [];
      let values = [];

      if(formType) {
        whereClause.push('formType = ?');
        values.push(formType);
      }

      if(visitId) {
        whereClause.push('visitId = ?');
        values.push(visitId);
      }

      if(refId && refId.trim() !== "") {
        whereClause.push('refId = ?');
        values.push(refId ? refId.toString() : null);
      }

      whereClause.push('active = "Y"');
      let query = `UPDATE trVisitPicture SET active = 'N' WHERE ${whereClause.join(' AND ')}`;
      await connection.execute(query, values);
    } else {
      for (let visitPicture of visitPictureList) {
        let whereClause = ["active = 'Y'"];
        let values = [];

        if(visitPicture.refId) {
          whereClause.push('refId = ?');
          values.push(visitPicture.refId.toString());
        }

        if(visitPicture.formType) {
          whereClause.push('formType = ?');
          values.push(visitPicture.formType);
        }

        if(visitPicture.visitId) {
          whereClause.push('visitId = ?');
          values.push(visitPicture.visitId);
        }

        let query = `UPDATE trVisitPicture SET active = 'N', updateDate = NOW() WHERE ${whereClause.join(' AND ')}`;
        await connection.execute(query, values);
      }
    }

    for(let visitPicture of visitPictureList) {
      if (visitPicture.pictureType !== "Text" && visitPicture.fileName) {
        visitPicture.picturePath = `${imagePath}/${visitPicture.fileName}`;
      }

      if(visitPicture.visitPictureId) {
        let [rows] = await connection.execute("SELECT visitPictureId FROM trVisitPicture WHERE visitPictureId = ?", [visitPicture.visitPictureId]);
        if (rows.length > 0) {
          let updateFields = Object.keys(visitPicture).filter(k => k !== "createdBy" && k !== "createDate");
          let setClause = updateFields.map(field => `${field} = ?`).join(", ");
          let values = updateFields.map(field => visitPicture[field]);
          values.push(visitPicture.visitPictureId);
          let query = `UPDATE trVisitPicture SET ${setClause} WHERE visitPictureId = ?`;
          await connection.execute(query, values);
        }
      } else {
          let fields = Object.keys(visitPicture);
          let placeholders = fields.map(() => "?").join(", ");
          let query = `INSERT INTO trVisitPicture (${fields.join(", ")}) VALUES (${placeholders})`;
          await connection.execute(query, Object.values(visitPicture));
      }
    }
    serviceResult = { code: 200, status: "Success", text: "Save Success" };
  } catch (err) {
      console.error(err);
      serviceResult = { code: 500, status: "Error", text: "Error: " + err.message };
  } finally {
      await connection.end();
  }

  if (isHttpResponse) {
      return res.json(serviceResult);
  }

});

app.get('/getVisitPicture', async (req, res) => {
  let { visitId, formType, refId } = req.query;
  let visitPictureList = [];

  const connection = await mysql.createConnection({
    host: '103.13.31.80',
    port: 3349,
    user: 'hm',
    password: 'Bankisahandsomeman@ssw0rd',
    database: 'hm_dev_t4'
  });

  try {
    if(visitId === undefined || formType === undefined) {
      throw new Error("visitId, formType is required");
    }

    const query = `SELECT * FROM trVisitPicture WHERE visitId = ? AND formType = ?`;
    let [result] = await connection.execute(query, [visitId, formType]);
    visitPictureList = result;
    serviceResult = { code: 200, status: "Success", text: "Save Success", data: visitPictureList };
  } catch (err) {
    console.error(err);
    serviceResult = { code: 500, status: "Error", text: "Error: " + err.message };
  } finally {
      await connection.end();
      res.json(serviceResult);
  }
});

app.listen(3001, () => {
  console.log('server running on port 3001');
}
);