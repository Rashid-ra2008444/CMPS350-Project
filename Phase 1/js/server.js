const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

// Enable JSON parsing for POST requests
app.use(express.json());

const filePath = path.join(__dirname, 'data', 'courses.json');

// Endpoint to get the course data
app.get("/courses", (req, res) => {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error reading file");
    }
    res.json(JSON.parse(data));  // Send the JSON data
  });
});

// Endpoint to add new course data
app.post("/courses", (req, res) => {
  const newCourse = req.body;

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error reading file");
    }

    const courses = JSON.parse(data);
    courses.push(newCourse);

    fs.writeFile(filePath, JSON.stringify(courses, null, 2), "utf8", (err) => {
      if (err) {
        return res.status(500).send("Error writing file");
      }
      res.status(200).send("Course added successfully");
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
