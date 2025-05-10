"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "../../components/css/statistics.module.css"
import { CourseDistributionChart, EnrollmentBarChart, GradeDistributionChart } from "../../components/StatisticsCharts"

export default function AdminStatistics() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    // Debug logging
    console.log("Client session in statistics page:", session);
    console.log("User role:", session?.user?.role);
    
    if (!session || session.user?.role !== "admin") {
      console.log("Not admin, redirecting... Role:", session?.user?.role);
      router.push("/auth/signin")
      return
    }

    fetchStatistics()
  }, [session, status, router])

  const fetchStatistics = async () => {
    try {
      console.log("Fetching statistics from API...");
      console.log("Current session:", session);
      
      const response = await fetch('/api/statistics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
      })
      
      console.log("API Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error response:", errorData);
        throw new Error(errorData.message || 'Failed to fetch statistics')
      }
      
      const data = await response.json()
      console.log("Statistics data received:", data);
      setStats(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching statistics:', error)
      setError('Failed to load statistics: ' + error.message)
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <section className="banner">
        <h1>Loading statistics...</h1>
      </section>
    )
  }

  if (error) {
    return (
      <section className="banner" style={{ color: "red" }}>
        <h1>Error: {error}</h1>
        <button onClick={fetchStatistics}>Retry</button>
      </section>
    )
  }

  if (!stats) {
    return (
      <section className="banner">
        <h1>No statistics available</h1>
      </section>
    )
  }

  return (
    <>
      <section className="banner">
        <h1 className="title">Course Management Statistics</h1>
        <h2>Comprehensive System Analytics</h2>
      </section>

      {/* Overview Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.blue}`}>
          <h3>Total Students</h3>
          <p className={styles.statValue}>{stats.totalStudents}</p>
        </div>
        <div className={`${styles.statCard} ${styles.green}`}>
          <h3>Total Instructors</h3>
          <p className={styles.statValue}>{stats.totalInstructors}</p>
        </div>
        <div className={`${styles.statCard} ${styles.purple}`}>
          <h3>Total Courses</h3>
          <p className={styles.statValue}>{stats.totalCourses}</p>
        </div>
        <div className={`${styles.statCard} ${styles.orange}`}>
          <h3>Total Enrollments</h3>
          <p className={styles.statValue}>{stats.totalEnrollments}</p>
        </div>
      </div>

      {/* Course Statistics */}
      <div className="course-box">
        <h2>Course Statistics</h2>
        <div className={styles.chartGrid}>
          <div className={styles.chartContainer}>
            <h3>Average Enrollment per Course</h3>
            <p className={styles.bigNumber}>{Math.round(stats.avgEnrollmentPerCourse)}</p>
          </div>
          <div className={styles.chartContainer}>
            <h3>Course Fill Rate</h3>
            <p className={styles.bigNumber}>{stats.courseFillRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="course-box">
        <h2>Visual Analytics</h2>
        <div className={styles.chartGrid}>
          <div className={styles.chartContainer}>
            <CourseDistributionChart coursesByCategory={stats.coursesByCategory} />
          </div>
          <div className={styles.chartContainer}>
            <EnrollmentBarChart topCourses={stats.topCourses} />
          </div>
          <div className={`${styles.chartContainer} ${styles.gradeChartFull}`}>
            <GradeDistributionChart gradeDistribution={stats.gradeDistribution} />
          </div>
        </div>
      </div>

      {/* Top Courses */}
      <div className="course-box">
        <h2>Top 5 Courses by Enrollment</h2>
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Category</th>
                <th>Instructor</th>
                <th>Enrollment</th>
                <th>Fill Rate</th>
              </tr>
            </thead>
            <tbody>
              {stats.topCourses.map((course, index) => (
                <tr key={index}>
                  <td>{course.name}</td>
                  <td>{course.category} {course.courseNum}</td>
                  <td>{course.instructor}</td>
                  <td>{course.enrollment_actual}/{course.enrollment_maximum}</td>
                  <td>{((course.enrollment_actual/course.enrollment_maximum)*100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Analysis */}
      <div className="course-box">
        <h2>Category Analysis</h2>
        <div className={styles.chartGrid}>
          <div className={styles.chartContainer}>
            <h3>Courses by Category</h3>
            <div className={styles.categoryList}>
              {stats.coursesByCategory.map((item, index) => (
                <div key={index} className={styles.categoryItem}>
                  <span className={styles.categoryName}>{item.category}</span>
                  <span className={styles.categoryValue}>{item._count.id} courses</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.chartContainer}>
            <h3>Students by Category</h3>
            <div className={styles.categoryList}>
              {Object.entries(stats.studentsByCategoryAggregate).map(([category, count], index) => (
                <div key={index} className={styles.categoryItem}>
                  <span className={styles.categoryName}>{category}</span>
                  <span className={styles.categoryValue}>{count} students</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grade Analysis */}
      <div className="course-box">
        <h2>Grade Analysis</h2>
        <div className={styles.chartGrid}>
          <div className={styles.chartContainer}>
            <h3>Grade Distribution</h3>
            <div className={styles.gradeList}>
              {stats.gradeDistribution.map((item, index) => (
                <div key={index} className={styles.gradeBar}>
                  <span className={styles.gradeName}>{item.grade}</span>
                  <div className={styles.gradeBarContainer}>
                    <div 
                      className={styles.gradeBarFill} 
                      style={{width: `${(item._count.id / stats.totalEnrollments * 100)}%`}}
                    ></div>
                  </div>
                  <span className={styles.gradeCount}>{item._count.id}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.chartContainer}>
            <h3>Performance Metrics</h3>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <h4>Success Rate</h4>
                <p className={styles.metricValue}>{stats.successRate.toFixed(1)}%</p>
              </div>
              <div className={styles.metricCard}>
                <h4>Failure Rate</h4>
                <p className={styles.metricValue}>{(100 - stats.successRate).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructor Analysis */}
      <div className="course-box">
        <h2>Instructor Analysis</h2>
        <div className={styles.chartGrid}>
          <div className={styles.chartContainer}>
            <h3>Instructor Workload</h3>
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Instructor</th>
                    <th>Courses</th>
                    <th>Total Students</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.instructorWorkload.map((item, index) => (
                    <tr key={index}>
                      <td>{item.instructor}</td>
                      <td>{item._count.id}</td>
                      <td>{item._sum.enrollment_actual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <h3>Most Popular Instructors</h3>
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Instructor</th>
                    <th>Total Students</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.popularInstructors.map((item, index) => (
                    <tr key={index}>
                      <td>{item.instructor}</td>
                      <td>{item._count.studentId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Failure Rate Analysis */}
      <div className="course-box">
        <h2>Failure Rate by Category</h2>
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Failure Rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.failureRateByCategory).map(([category, rate], index) => (
                <tr key={index}>
                  <td>{category}</td>
                  <td>{rate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prerequisite Analysis */}
      <div className="course-box">
        <h2>Prerequisite Impact Analysis</h2>
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Prerequisite</th>
                <th>Course Count</th>
                <th>Avg Enrollment</th>
              </tr>
            </thead>
            <tbody>
              {stats.prerequisiteAnalysis.map((item, index) => (
                <tr key={index}>
                  <td>{item.prerequisite || 'None'}</td>
                  <td>{item._count.id}</td>
                  <td>{Math.round(item._avg.enrollment_actual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="banner">
        &copy; Qatar University Group Project Collections of this magnificant Work 2025. All rights reserved
      </footer>
    </>
  )
}