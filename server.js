const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const history = require("connect-history-api-fallback");
const mysql = require("mysql");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
// password: "@wLKt3Cu7k_8Aa*b",
// database: "invoice",

// password: "",
//    database: "bill",

const connection = mysql.createConnection({
   host: "localhost",
   user: "root",
   password: "@wLKt3Cu7k_8Aa*b",
   database: "invoice",
   port: 3306,
});

connection.connect((error) => {
   if (error) throw error;
   console.log("Successfully connected to the database.");
});

app.get("/bills", function (req, res) {
   connection.query(
      `SELECT * FROM bill JOIN store JOIN province JOIN billInfo ON bill.storeId = store.idStore AND billInfo.billId = bill.idBill AND province.idProvince = bill.provinceId LEFT JOIN driver ON bill.driverId = driver.idDriver`,
      (err, result) => {
         if (err) {
            res.status(404).send({ message: "can't solve problem" });
            return;
         } else {
            if (result.length > 0) {
               res.send(result);
            } else {
               res.status(404).send({ message: "not found bills" });
            }
         }
      }
   );
});

app.get("/driverBills", function (req, res) {
   connection.query(
      `SELECT * FROM bill JOIN store JOIN province JOIN billInfo ON bill.storeId = store.idStore AND billInfo.billId = bill.idBill AND province.idProvince = bill.provinceId LEFT JOIN driver ON bill.driverId = driver.idDriver WHERE bill.pending = 0 AND bill.delivered = 0 AND bill.driverId = 0`,
      (err, result) => {
         if (err) {
            res.status(404).send({ message: "can't solve problem" });
            return;
         } else {
            if (result.length > 0) {
               res.send(result);
            } else {
               res.status(404).send({ message: "not found bills" });
            }
         }
      }
   );
});

app.get("/allProvince", function (req, res) {
   connection.query(`SELECT * FROM province`, (err, result) => {
      if (err) {
         res.send({ message: "can't solve problem" });
         return;
      } else {
         if (result.length > 0) {
            res.send(result);
         } else {
            res.send({ message: "not found province" });
         }
      }
   });
});

app.post("/login", function (req, res) {
   let userName = req.body.user;
   let password = req.body.password;
   connection.query(
      `SELECT * FROM admin WHERE userName = '${userName}' AND password = '${password}'`,
      (err, result) => {
         if (err) {
            res.send({ message: "can't solve problem" });
            console.log(err);
            return;
         } else {
            if (result.length > 0) {
               res.send(result);
            } else {
               res.send({ message: "not found admin" });
            }
         }
      }
   );
});

app.put("/updateReturn/:id", function (req, res) {
   let id = req.params.id;
   let returned = req.body.returned;
   connection.query(
      `UPDATE bill SET returned = ? WHERE idBill = ? `,
      [returned, id],
      (err, result) => {
         if (err) {
            console.log(err);
            res.status(500).send({
               message:
                  err.message || "Some error occurred while updating the bill.",
            });
         } else {
            res.send(result);
         }
      }
   );
});

app.put("/updateDelivered/:id", function (req, res) {
   let id = req.params.id;
   let delivered = req.body.delivered;
   connection.query(
      `UPDATE bill SET delivered = ? WHERE idBill = ? `,
      [delivered, id],
      (err, result) => {
         if (err) {
            console.log(err);
            res.status(500).send({
               message:
                  err.message || "Some error occurred while updating the bill.",
            });
         } else {
            res.send(result);
         }
      }
   );
});

app.put("/setDriverBill", function (req, res) {
   let data = req.body;

   let allData = data.driverBill.map((bill) => {
      return `WHEN ${bill.idBill} THEN ${data.driverId}`;
   });

   let allPending = data.driverBill.map((bill) => {
      return `WHEN ${bill.idBill} THEN 1`;
   });

   let queryString = allData.join(" ");
   let pendingQuery = allPending.join(" ");

   connection.query(
      `UPDATE bill SET driverId = CASE idBill ${queryString} ELSE driverId END, pending = CASE idBill ${pendingQuery} ELSE pending END`,
      (err, result) => {
         if (err) {
            console.log(err);
            res.status(500).send({
               message:
                  err.message || "Some error occurred while updating the bill.",
            });
         } else {
            res.send(result);
         }
      }
   );
});

app.post("/addDriver", function (req, res) {
   let driver = req.body;
   connection.query(`INSERT INTO driver SET ?`, driver, (err, result) => {
      if (err) {
         res.status(500).send({
            message:
               err.message || "Some error occurred while creating the driver.",
         });
      } else {
         console.log("created driver: ", { id: result.insertId, ...driver });
         res.send({ id: result.insertId, ...driver });
      }
   });
});
app.delete("/deleteDriver/:id", function (req, res) {
   let id = req.params.id;
   connection.query(
      "DELETE FROM driver WHERE idDriver = ?",
      id,
      (err, result) => {
         if (err) {
            console.log("error: ", err);
            res.status(500).send({
               message:
                  err.message ||
                  "Some error occurred while creating the driver.",
            });
         } else {
            console.log("deleted driver  with id: ", id);
            res.send({ message: "driver deleted" });
         }
      }
   );
});

app.delete("/deleteStore/:id", function (req, res) {
   let id = req.params.id;
   connection.query(
      "DELETE FROM store WHERE idStore = ?",
      id,
      (err, result) => {
         if (err) {
            console.log("error: ", err);
            res.status(500).send({
               message:
                  err.message ||
                  "Some error occurred while creating the store.",
            });
         } else {
            console.log("deleted store  with id: ", id);
            res.send({ message: "store deleted" });
         }
      }
   );
});

app.post("/addStore", function (req, res) {
   let store = req.body;
   connection.query(`INSERT INTO store SET ?`, store, (err, result) => {
      if (err) {
         res.status(500).send({
            message:
               err.message || "Some error occurred while creating the store.",
         });
      } else {
         console.log("created store: ", { id: result.insertId, ...store });
         res.send({ id: result.insertId, ...store });
      }
   });
});

app.get("/drivers", function (req, res) {
   connection.query(`SELECT * FROM driver`, (err, result) => {
      if (err) {
         res.status(500).send({
            message: err.message || "Some error occurred .",
         });
      } else {
         if (result.length < 1) {
            res.status(404).send({
               message: err.message || "not found.",
            });
         } else {
            res.send(result);
         }
      }
   });
});

app.get("/driver/:id", function (req, res) {
   let driverId = req.params.id;
   connection.query(
      `SELECT * FROM driver WHERE idDriver = ${driverId}`,
      (err, result) => {
         if (err) {
            res.status(500).send({
               message: err.message || "Some error occurred .",
            });
         } else {
            if (result.length < 1) {
               res.status(404).send({
                  message: err.message || "not found.",
               });
            } else {
               res.send(result);
            }
         }
      }
   );
});

app.get("/allStores", function (req, res) {
   connection.query(`SELECT * FROM store`, (err, result) => {
      if (err) {
         res.status(500).send({
            message: err.message || "Some error occurred .",
         });
      } else {
         if (result.length < 1) {
            res.status(404).send({
               message: err.message || "not found.",
            });
         } else {
            res.send(result);
         }
      }
   });
});

app.post("/addBill", function (req, res) {
   let billInformation = req.body;
   let date = new Date().toISOString().slice(0, 19).replace("T", " ");
   connection.query(
      `INSERT INTO bill (billNo,billDate,driverId,storeId,provinceId) VALUES (${billInformation.billNo} ,'${date}' ,${billInformation.driverId},${billInformation.storeId},${billInformation.provinceId})`,
      (err, result) => {
         if (err) {
            console.log("error: ", err);
            res.status(500).send({
               message:
                  err.message || "Some error occurred while creating the bill.",
            });
            return;
         } else {
            console.log("created bill: ", {
               id: result.insertId,
            });
            connection.query(
               `INSERT INTO billInfo (customerName  , customerPhone , address , totalPrice , note , billId) VALUES ? `,
               [
                  billInformation.billInfo.map((Info) => [
                     Info.customerName,
                     Info.customerPhone,
                     Info.address,
                     Info.totalPrice,
                     Info.note,
                     result.insertId,
                  ]),
               ],
               (err, result) => {
                  if (err) {
                     res.status(500).send({
                        message:
                           err.message ||
                           "Some error occurred while creating the bill.",
                     });
                  } else {
                     res.send(result);
                  }
               }
            );
         }
      }
   );
});

app.post("/editBill/:id", function (req, res) {
   let billInformation = req.body;

   connection.query(
      `UPDATE  bill SET billNo = ${billInformation.billNo} ,driverId = ${billInformation.driverId} , storeId = ${billInformation.storeId},provinceId = ${billInformation.provinceId} WHERE idBill = ${billInformation.idBill}`,
      (err, result) => {
         if (err) {
            console.log("error: ", err);
            res.status(500).send({
               message:
                  err.message || "Some error occurred while updating the bill.",
            });
            return;
         } else {
            console.log("update bill: ", {
               id: result,
            });
            connection.query(
               `UPDATE billInfo SET customerName = '${billInformation.customerName}' , customerPhone = '${billInformation.customerPhone}' , address = '${billInformation.address}' , totalPrice = '${billInformation.totalPrice}', note = '${billInformation.note}' WHERE  idInfo = ${billInformation.idInfo} `,
               (err, result) => {
                  if (err) {
                     res.status(500).send({
                        message:
                           err.message ||
                           "Some error occurred while creating the bill.",
                     });
                  } else {
                     res.send(result);
                  }
               }
            );
         }
      }
   );
});

const staticFileMiddleware = express.static(__dirname + "/dist");
app.use(staticFileMiddleware);
app.use(
   history({
      disableDotRule: true,
      verbose: true,
   })
);

app.use(staticFileMiddleware);

app.listen(5000, () => {
   console.log("Server is running on port 5580.");
});
