// src/components/JobList.jsx
import { useEffect, useState } from 'react';
import API from '../api';

export default function JobList() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    API.get('jobs/')
      .then((res) => setJobs(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Available Job Postings</h2>
      {jobs.map((job) => (
        <div key={job.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
          <h3>{job.title}</h3>
          <p><strong>Location:</strong> {job.location}</p>
          <p><strong>Type:</strong> {job.job_type}</p>
          <p>{job.description}</p>
        </div>
      ))}
    </div>
  );
}