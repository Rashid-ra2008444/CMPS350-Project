"use server"
import { CourseRepository } from "../repo/repository"
import { UserRepository } from "../repo/repository"
import { EnrollmentRepository } from "../repo/repository"

export async function findByUsernameActions(username) {
  return await UserRepository.findByUsername(username);
}

export async function authenticateActions(username, password) {
  return await UserRepository.authenticate(username, password);
}

export async function createUserActions(userData) {
  return await UserRepository.create(userData);
}

export async function findAllCoursesActions() {
    return await CourseRepository.findAll();
}

export async function findCourseByCRNActions(crn) {
    return await CourseRepository.findByCRN(crn);
}

export async function findByStatusActions(status) {
    return await UserRepository.findByStatus(status);
}

export async function createCourseActions(courseData) {
    return await CourseRepository.create(courseData);
}

export async function updateCourseActions(field,value, courseData) {
    return await CourseRepository.update(field,value, courseData);
}

export async function updateStatusActions(crn, status) {
    return await CourseRepository.updateStatus(crn, status);
}

export async function deleteCourseActions(field, value) {
    return await CourseRepository.delete(field, value);
}

export async function findAllEnrollmentsActions() {
    return await EnrollmentRepository.findAll();
}

export async function findByStudentIdActions(studentId) {
    return await EnrollmentRepository.findByStudentId(studentId);
}

export async function findEnrollmentByCRNActions(crn) {
    return await EnrollmentRepository.findByCRN(crn);
}

export async function createEnrollmentActions(enrollmentData) {
    return await EnrollmentRepository.create(enrollmentData);
}

export async function updateGradeActions(studentId, crn, grade) {
    return await EnrollmentRepository.updateGrade(studentId, crn, grade);
}

export async function updateCourseStatusActions(crn, status) {
    return await EnrollmentRepository.updateCourseStatus(crn, status);
}

export async function saveAllActions(enrollmentData) {
    return await EnrollmentRepository.saveAll(enrollmentData);
}

export async function deleteEnrollmentByIdActions(id){
    return await EnrollmentRepository.delete(id);
}