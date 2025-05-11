"use server"

import {courseRepository } from "../repo/repository"
import {userRepository } from "../repo/repository"
import {enrollmentRepository } from "../repo/repository"

export async function findByUsernameActions(username) {
  return await userRepository.findByUsername(username);
}

export async function authenticateActions(username, password) {
  return await userRepository.authenticate(username, password);
}

export async function createUserActions(userData) {
  return await userRepository.create(userData);
}

export async function findAllCoursesActions() {
    return await courseRepository.findAll();
}

export async function findCourseByCRNActions(crn) {
    return await courseRepository.findByCRN(crn);
}

export async function findByStatusActions(status) {
    return await userRepository.findByStatus(status);
}

export async function createCourseActions(courseData) {
    return await courseRepository.create(courseData);
}

export async function updateCourseActions(crn, courseData) {
    return await courseRepository.update(crn, courseData);
}

export async function updateStatusActions(crn, status) {
    return await courseRepository.updateStatus(crn, status);
}

export async function deleteCourseActions(crn) {
    return await courseRepository.delete(crn);
}

export async function findAllEnrollmentsActions() {
    return await enrollmentRepository.findAll();
}

export async function findByStudentIdActions(studentId) {
    return await enrollmentRepository.findByStudentId(studentId);
}

export async function findEnrollmentByCRNActions(crn) {
    return await enrollmentRepository.findByCRN(crn);
}

export async function createEnrollmentActions(enrollmentData) {
    return await enrollmentRepository.create(enrollmentData);
}

export async function updateGradeActions(studentId, crn, grade) {
    return await enrollmentRepository.updateGrade(studentId, crn, grade);
}

export async function updateCourseStatusActions(crn, status) {
    return await enrollmentRepository.updateCourseStatus(crn, status);
}

export async function saveAllActions(enrollmentData) {
    return await enrollmentRepository.saveAll(enrollmentData);
}

export async function deleteEnrollmentByIdActions(id){
    return await enrollmentRepository.delete(id);
}