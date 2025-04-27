// app/admin/statistics/StatisticsCharts.jsx
"use client"

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export const CourseDistributionChart = ({ coursesByCategory }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    const data = {
      labels: coursesByCategory.map(item => item.category),
      datasets: [{
        data: coursesByCategory.map(item => item._count.id),
        backgroundColor: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'],
        borderColor: '#333',
        borderWidth: 3
      }]
    };

    chartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          },
          title: {
            display: true,
            text: 'Course Distribution by Category',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [coursesByCategory]);

  return (
    <canvas ref={chartRef} style={{ maxHeight: '300px' }}></canvas>
  );
};

export const EnrollmentBarChart = ({ topCourses }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    const data = {
      labels: topCourses.map(course => course.name),
      datasets: [{
        label: 'Enrollment',
        data: topCourses.map(course => course.enrollment_actual),
        backgroundColor: '#0088FE',
        borderColor: '#333',
        borderWidth: 3
      }]
    };

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#eee'
            },
            ticks: {
              font: {
                weight: 'bold'
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                weight: 'bold'
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Top 5 Courses by Enrollment',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [topCourses]);

  return (
    <canvas ref={chartRef} style={{ maxHeight: '300px' }}></canvas>
  );
};

export const GradeDistributionChart = ({ gradeDistribution }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    const gradeColors = {
      'A': '#4CAF50',    
      'B+': '#8BC34A',   
      'B': '#CDDC39',    
      'C+': '#FFEB3B',   
      'C': '#FFC107',    
      'D+': '#FF9800',  
      'D': '#FF5722',    
      'F': '#F44336'     
    };

    const gradeOrder = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
    
    const sortedGradeDistribution = gradeOrder.map(grade => {
      const gradeData = gradeDistribution.find(item => item.grade === grade);
      return gradeData || { grade: grade, _count: { id: 0 } };
    });

    const data = {
      labels: sortedGradeDistribution.map(item => item.grade),
      datasets: [{
        data: sortedGradeDistribution.map(item => item._count.id),
        backgroundColor: sortedGradeDistribution.map(item => gradeColors[item.grade]),
        borderColor: '#333',
        borderWidth: 3
      }]
    };

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                size: 14,
                weight: 'bold'
              }
            }
          },
          title: {
            display: true,
            text: 'Grade Distribution',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [gradeDistribution]);

  return (
    <canvas ref={chartRef} style={{ maxHeight: '300px' }}></canvas>
  );
};