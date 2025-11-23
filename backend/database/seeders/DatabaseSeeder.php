<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::create([
            'username' => 'admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('admin123'),
            'role' => 'admin',
        ]);

        // Create student users
        $student1 = User::create([
            'username' => 'jdoe',
            'email' => 'jdoe@example.com',
            'password' => bcrypt('student123'),
            'role' => 'student',
        ]);

        $student2 = User::create([
            'username' => 'asmith',
            'email' => 'asmith@example.com',
            'password' => bcrypt('student123'),
            'role' => 'student',
        ]);

        // Create students
        $admin->student()->create([
            'student_id' => 'ADM001',
            'first_name' => 'Admin',
            'last_name' => 'User',
            'date_of_birth' => '1990-01-01',
        ]);

        $student1->student()->create([
            'student_id' => 'STU001',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'date_of_birth' => '2000-05-15',
            'department' => 'Computer Science',
            'year' => 3,
        ]);

        $student2->student()->create([
            'student_id' => 'STU002',
            'first_name' => 'Alice',
            'last_name' => 'Smith',
            'date_of_birth' => '2001-03-20',
            'department' => 'Mathematics',
            'year' => 2,
        ]);

        // Create courses
        \App\Models\Course::create([
            'course_code' => 'CS101',
            'course_name' => 'Introduction to Programming',
            'credits' => 3,
            'department' => 'Computer Science',
            'instructor' => 'Dr. Johnson',
            'semester' => 'Fall 2024',
            'year' => 2024,
        ]);

        \App\Models\Course::create([
            'course_code' => 'MATH201',
            'course_name' => 'Calculus II',
            'credits' => 4,
            'department' => 'Mathematics',
            'instructor' => 'Prof. Brown',
            'semester' => 'Fall 2024',
            'year' => 2024,
        ]);

        // Enrollments
        \App\Models\Enrollment::create([
            'student_id' => 2, // jdoe
            'course_id' => 1, // CS101
        ]);

        \App\Models\Enrollment::create([
            'student_id' => 3, // asmith
            'course_id' => 2, // MATH201
        ]);

        // Attendance
        \App\Models\Attendance::create([
            'student_id' => 2,
            'course_id' => 1,
            'date' => '2024-09-01',
            'status' => 'present',
        ]);

        // Grades
        \App\Models\Grade::create([
            'student_id' => 2,
            'course_id' => 1,
            'assessment_type' => 'midterm',
            'score' => 85,
            'max_score' => 100,
        ]);

        // Create parent user
        $parent = User::create([
            'username' => 'parent1',
            'email' => 'parent@example.com',
            'password' => bcrypt('parent123'),
            'role' => 'parent',
        ]);

        // Update student with parent
        $student1->student->update(['parent_id' => $parent->id]);

        // Create applications
        \App\Models\Application::create([
            'application_number' => 'APP-001',
            'first_name' => 'Bob',
            'last_name' => 'Wilson',
            'email' => 'bob@example.com',
            'phone' => '123-456-7890',
            'date_of_birth' => '2002-07-10',
            'address' => '123 Main St, City, State',
            'department' => 'Engineering',
            'year' => 1,
            'previous_education' => 'High School Diploma',
            'gpa' => 3.8,
            'status' => 'pending',
        ]);

        // Create assessments
        \App\Models\Assessment::create([
            'course_id' => 1,
            'assessment_name' => 'Midterm Exam',
            'assessment_type' => 'exam',
            'total_marks' => 100,
            'weightage' => 30,
            'due_date' => '2024-10-15',
            'description' => 'Comprehensive midterm examination',
        ]);

        // Create fees
        \App\Models\Fee::create([
            'student_id' => 2,
            'fee_type' => 'tuition',
            'amount' => 5000,
            'due_date' => '2024-09-01',
            'description' => 'Fall 2024 Tuition Fee',
        ]);

        // Create payments
        \App\Models\Payment::create([
            'student_id' => 2,
            'fee_id' => 1,
            'amount' => 2500,
            'payment_method' => 'bank_transfer',
            'transaction_id' => 'TXN001',
            'payment_date' => '2024-09-01',
            'notes' => 'Partial payment',
        ]);

        // Create schedules
        \App\Models\Schedule::create([
            'course_id' => 1,
            'day_of_week' => 'monday',
            'start_time' => '09:00',
            'end_time' => '10:30',
            'room' => 'Room 101',
            'semester' => 'Fall 2024',
            'year' => 2024,
        ]);

        // Create notifications
        \App\Models\Notification::create([
            'user_id' => $student1->id,
            'title' => 'Welcome',
            'message' => 'Welcome to the Student Information Management System!',
            'type' => 'welcome',
        ]);

        // Create behavior logs
        \App\Models\BehaviorLog::create([
            'student_id' => 2,
            'reported_by' => $admin->id,
            'incident_type' => 'positive',
            'description' => 'Helped classmate with assignment',
            'incident_date' => '2024-09-05',
            'severity' => 'low',
            'action_taken' => 'Recognition given',
        ]);

        // Create health records
        \App\Models\HealthRecord::create([
            'student_id' => 2,
            'record_type' => 'allergy',
            'description' => 'Allergic to peanuts',
            'record_date' => '2024-08-01',
            'provider' => 'School Nurse',
            'emergency_contact' => true,
        ]);
    }
}
