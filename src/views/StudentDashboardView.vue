<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()

const currentUser = ref({})
const assignments = ref([])
const submissions = ref([])
const announcements = ref([])
const activeTab = ref('dashboard')
const selectedAssignment = ref(null)
const selectedDescription = ref(null)
const selectedFile = ref(null)
const isLoading = ref(false)
const isEditingSubmission = ref(false)
const isUploadingFile = ref(false)

const notification = ref({
  show: false,
  message: '',
  type: 'success'
})

const submissionForm = ref({
  submissionId: '',
  answer: '',
  fileLink: ''
})

const profileForm = ref({
  full_name: '',
  email: '',
  course: '',
  year_level: '',
  password: ''
})

const showNotification = (message, type = 'success') => {
  notification.value = {
    show: true,
    message,
    type
  }

  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const normalizeAssignment = (item) => ({
  assignmentId: item.id,
  title: item.title,
  course: item.course,
  yearLevel: item.year_level,
  deadline: item.deadline,
  description: item.description,
  createdAt: item.created_at
})

const normalizeSubmission = (item) => ({
  submissionId: item.id,
  assignmentId: item.assignment_id,
  assignmentTitle: item.assignment_title,
  studentId: item.student_id,
  studentName: item.student_name,
  answer: item.answer,
  fileLink: item.file_link,
  status: item.status,
  grade: item.grade,
  submittedAt: item.submitted_at || item.created_at
})

const normalizeAnnouncement = (item) => ({
  announcementId: item.id,
  title: item.title,
  course: item.course,
  yearLevel: item.year_level,
  message: item.message,
  createdAt: item.created_at
})

const loadStudentData = async () => {
  isLoading.value = true

  const savedUser = JSON.parse(localStorage.getItem('currentUser'))

  if (!savedUser) {
    router.push('/')
    return
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', savedUser.id)
    .maybeSingle()

  if (profileError || !profileData) {
    currentUser.value = savedUser
  } else {
    currentUser.value = profileData
    localStorage.setItem('currentUser', JSON.stringify(profileData))
  }

  profileForm.value = {
    full_name: currentUser.value.full_name || '',
    email: currentUser.value.email || '',
    course: currentUser.value.course || '',
    year_level: currentUser.value.year_level || '',
    password: ''
  }

  const { data: assignmentData, error: assignmentError } = await supabase
    .from('assignments')
    .select('*')
    .order('created_at', { ascending: false })

  if (!assignmentError && assignmentData) {
    assignments.value = assignmentData.map(normalizeAssignment)
  }

  const { data: submissionData, error: submissionError } = await supabase
    .from('submissions')
    .select('*')
    .eq('student_id', currentUser.value.student_id)
    .order('created_at', { ascending: false })

  if (!submissionError && submissionData) {
    submissions.value = submissionData.map(normalizeSubmission)
  }

  const { data: announcementData, error: announcementError } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (!announcementError && announcementData) {
    announcements.value = announcementData.map(normalizeAnnouncement)
  }

  isLoading.value = false
}

onMounted(async () => {
  await loadStudentData()
})

const filteredAssignments = computed(() =>
  assignments.value.filter(assignment => {
    return (
      assignment.course === currentUser.value.course &&
      assignment.yearLevel === currentUser.value.year_level
    )
  })
)

const filteredAnnouncements = computed(() =>
  announcements.value.filter(announcement => {
    return (
      announcement.course === currentUser.value.course &&
      announcement.yearLevel === currentUser.value.year_level
    )
  })
)

const mySubmissions = computed(() =>
  submissions.value.filter(
    item => item.studentId === currentUser.value.student_id
  )
)

const totalAssignments = computed(() => filteredAssignments.value.length)

const totalSubmitted = computed(() => mySubmissions.value.length)

const totalPending = computed(() =>
  filteredAssignments.value.filter(
    assignment => !hasSubmitted(assignment.assignmentId)
  ).length
)

const totalAnnouncements = computed(() =>
  filteredAnnouncements.value.length
)

const getSubmissionByAssignment = (assignmentId) => {
  return mySubmissions.value.find(
    item => item.assignmentId === assignmentId
  )
}

const hasSubmitted = (assignmentId) => {
  return !!getSubmissionByAssignment(assignmentId)
}

const getAssignmentStatus = (assignmentId) => {
  return hasSubmitted(assignmentId) ? 'Completed' : 'Pending'
}

const openSubmitForm = (assignment) => {
  selectedAssignment.value = assignment
  selectedFile.value = null
  isEditingSubmission.value = false

  submissionForm.value = {
    submissionId: '',
    answer: '',
    fileLink: ''
  }
}

const openEditSubmission = (assignment) => {
  const existingSubmission = getSubmissionByAssignment(
    assignment.assignmentId
  )

  if (!existingSubmission) {
    showNotification('Submission not found.', 'error')
    return
  }

  selectedAssignment.value = assignment
  selectedFile.value = null
  isEditingSubmission.value = true

  submissionForm.value = {
    submissionId: existingSubmission.submissionId,
    answer: existingSubmission.answer || '',
    fileLink: existingSubmission.fileLink || ''
  }
}

const closeSubmitModal = () => {
  selectedAssignment.value = null
  selectedFile.value = null
  isEditingSubmission.value = false

  submissionForm.value = {
    submissionId: '',
    answer: '',
    fileLink: ''
  }
}

const openDescription = (assignment) => {
  selectedDescription.value = assignment
}

const handleFileChange = (event) => {
  selectedFile.value = event.target.files[0]
}

const uploadSubmissionFile = async () => {
  if (!selectedFile.value) {
    return submissionForm.value.fileLink
  }

  isUploadingFile.value = true

  const file = selectedFile.value
  const fileExt = file.name.split('.').pop()
  const safeFileName = file.name
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.-]/g, '')

  const filePath =
    `${currentUser.value.student_id}/${Date.now()}-${safeFileName}`

  const { error: uploadError } = await supabase.storage
    .from('submissions')
    .upload(filePath, file)

  if (uploadError) {
    console.log(uploadError)
    isUploadingFile.value = false
    showNotification('Failed to upload file.', 'error')
    return null
  }

  const { data } = supabase.storage
    .from('submissions')
    .getPublicUrl(filePath)

  isUploadingFile.value = false

  return data.publicUrl
}

const submitAssignment = async () => {
  if (
    !submissionForm.value.answer &&
    !submissionForm.value.fileLink &&
    !selectedFile.value
  ) {
    showNotification(
      'Please enter your answer, file link, or upload a file.',
      'error'
    )
    return
  }

  const finalFileLink = await uploadSubmissionFile()

  if (finalFileLink === null) {
    return
  }

  if (isEditingSubmission.value) {
    const { error } = await supabase
      .from('submissions')
      .update({
        answer: submissionForm.value.answer,
        file_link: finalFileLink,
        submitted_at: new Date().toISOString()
      })
      .eq('id', submissionForm.value.submissionId)

    if (error) {
      console.log(error)
      showNotification('Failed to update submission.', 'error')
      return
    }

    closeSubmitModal()

    await loadStudentData()

    showNotification('Submission updated successfully.')
    return
  }

  const { error } = await supabase
    .from('submissions')
    .insert([
      {
        assignment_id: selectedAssignment.value.assignmentId,
        assignment_title: selectedAssignment.value.title,
        student_id: currentUser.value.student_id,
        student_name: currentUser.value.full_name,
        answer: submissionForm.value.answer,
        file_link: finalFileLink,
        status: 'Completed',
        grade: 'Not graded',
        submitted_at: new Date().toISOString()
      }
    ])

  if (error) {
    console.log(error)
    showNotification('Failed to submit assignment.', 'error')
    return
  }

  closeSubmitModal()

  await loadStudentData()

  showNotification('Assignment submitted successfully.')
}

const saveProfile = async () => {
  if (
    !profileForm.value.full_name ||
    !profileForm.value.email ||
    !profileForm.value.course ||
    !profileForm.value.year_level
  ) {
    showNotification(
      'Please fill in all profile information.',
      'error'
    )
    return
  }

  const updateData = {
    full_name: profileForm.value.full_name,
    email: profileForm.value.email,
    course: profileForm.value.course,
    year_level: profileForm.value.year_level,
    password:
      profileForm.value.password ||
      currentUser.value.password
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', currentUser.value.id)

  if (error) {
    console.log(error)
    showNotification('Failed to update profile.', 'error')
    return
  }

  currentUser.value = {
    ...currentUser.value,
    ...updateData
  }

  localStorage.setItem(
    'currentUser',
    JSON.stringify(currentUser.value)
  )

  profileForm.value.password = ''

  showNotification('Profile updated successfully.')
}

const resetProfile = () => {
  profileForm.value = {
    full_name: currentUser.value.full_name || '',
    email: currentUser.value.email || '',
    course: currentUser.value.course || '',
    year_level: currentUser.value.year_level || '',
    password: ''
  }
}

const logout = () => {
  localStorage.removeItem('currentUser')
  router.push('/')
}
</script>

<template>
  <main class="page">
    <div
      v-if="notification.show"
      class="notification"
      :class="notification.type"
    >
      {{ notification.message }}
    </div>

    <aside class="sidebar">
      <h1>Student Tracker</h1>

      <nav class="menu">
        <button
          class="nav"
          :class="{ active: activeTab === 'dashboard' }"
          @click="activeTab = 'dashboard'"
        >
          Dashboard
        </button>

        <button
          class="nav"
          :class="{ active: activeTab === 'assignments' }"
          @click="activeTab = 'assignments'"
        >
          Assignments
        </button>

        <button
          class="nav"
          :class="{ active: activeTab === 'submissions' }"
          @click="activeTab = 'submissions'"
        >
          Submissions
        </button>

        <button
          class="nav"
          :class="{ active: activeTab === 'announcements' }"
          @click="activeTab = 'announcements'"
        >
          Announcements
        </button>

        <button
          class="nav"
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          Settings
        </button>
      </nav>

      <button class="logout-btn" @click="logout">
        Logout
      </button>
    </aside>

    <section class="content">
      <div class="topbar">
        <div>
          <h2>
            {{
              activeTab === 'dashboard'
                ? 'Dashboard'
                : activeTab === 'assignments'
                  ? 'Assignments'
                  : activeTab === 'submissions'
                    ? 'Submissions'
                    : activeTab === 'announcements'
                      ? 'Announcements'
                      : 'Settings'
            }}
          </h2>

          <p>Welcome back, {{ currentUser.full_name }}</p>
        </div>

        <div class="profile">👤</div>
      </div>

      <div v-if="isLoading" class="panel full">
        <h3>Loading...</h3>
        <div class="message">Please wait while we load your student data.</div>
      </div>

      <template v-else>
        <div class="cards">
          <div class="card">
            <div class="icon">🎓</div>

            <div>
              <span>Course</span>
              <h3>{{ currentUser.course }}</h3>
            </div>
          </div>

          <div class="card">
            <div class="icon purple">📚</div>

            <div>
              <span>Year Level</span>
              <h3>{{ currentUser.year_level }}</h3>
            </div>
          </div>

          <div class="card">
            <div class="icon green">✅</div>

            <div>
              <span>Completed</span>
              <h3>{{ totalSubmitted }}</h3>
            </div>
          </div>

          <div class="card">
            <div class="icon orange">📢</div>

            <div>
              <span>Announcements</span>
              <h3>{{ totalAnnouncements }}</h3>
            </div>
          </div>
        </div>

        <template v-if="activeTab === 'dashboard'">
          <div class="main-grid">
            <div class="panel">
              <h3>Student Information</h3>

              <div class="info-row">
                <span>Full Name</span>
                <strong>{{ currentUser.full_name }}</strong>
              </div>

              <div class="info-row">
                <span>Student ID</span>
                <strong>{{ currentUser.student_id }}</strong>
              </div>

              <div class="info-row">
                <span>Course</span>
                <strong>{{ currentUser.course }}</strong>
              </div>

              <div class="info-row">
                <span>Year Level</span>
                <strong>{{ currentUser.year_level }}</strong>
              </div>
            </div>

            <div class="panel">
              <h3>Course Overview</h3>

              <div class="info-row">
                <span>Total Assignments</span>
                <strong>{{ totalAssignments }}</strong>
              </div>

              <div class="info-row">
                <span>Completed</span>
                <strong>{{ totalSubmitted }}</strong>
              </div>

              <div class="info-row">
                <span>Pending</span>
                <strong>{{ totalPending }}</strong>
              </div>

              <div class="info-row">
                <span>Announcements</span>
                <strong>{{ totalAnnouncements }}</strong>
              </div>

              <div class="message">
                Assignments and announcements are automatically shown based on your registered course and year level.
              </div>
            </div>
          </div>
        </template>

        <template v-if="activeTab === 'assignments'">
          <div class="panel full">
            <h3>
              Assignments for {{ currentUser.course }} - {{ currentUser.year_level }}
            </h3>

            <div
              v-if="filteredAssignments.length === 0"
              class="empty"
            >
              <div>
                <div class="empty-icon">📚</div>

                <h2>No assignments available</h2>

                <p>
                  Your instructor has not posted assignments for your course and year level yet.
                </p>
              </div>
            </div>

            <div
              v-else
              class="assignment-list"
            >
              <div
                v-for="assignment in filteredAssignments"
                :key="assignment.assignmentId"
                class="assignment-item"
              >
                <div>
                  <h4>{{ assignment.title }}</h4>

                  <p>
                    {{ assignment.course }}
                    •
                    {{ assignment.yearLevel }}
                  </p>

                  <small>
                    Due: {{ assignment.deadline }}
                  </small>

                  <button
                    class="description-btn"
                    @click="openDescription(assignment)"
                  >
                    View Description
                  </button>
                </div>

                <div class="actions">
                  <span
                    class="status"
                    :class="{
                      pending: getAssignmentStatus(assignment.assignmentId) === 'Pending',
                      completedStatus: getAssignmentStatus(assignment.assignmentId) === 'Completed'
                    }"
                  >
                    {{ getAssignmentStatus(assignment.assignmentId) }}
                  </span>

                  <button
                    v-if="!hasSubmitted(assignment.assignmentId)"
                    class="submit-btn"
                    @click="openSubmitForm(assignment)"
                  >
                    Submit
                  </button>

                  <button
                    v-else
                    class="edit-submit-btn"
                    @click="openEditSubmission(assignment)"
                  >
                    Edit Submission
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="activeTab === 'submissions'">
          <div class="panel full">
            <h3>My Submissions</h3>

            <div
              v-if="mySubmissions.length === 0"
              class="empty"
            >
              <div>
                <div class="empty-icon">📝</div>

                <h2>No submissions yet</h2>

                <p>Your submitted assignments will appear here.</p>
              </div>
            </div>

            <div
              v-else
              class="assignment-list"
            >
              <div
                v-for="submission in mySubmissions"
                :key="submission.submissionId"
                class="assignment-item"
              >
                <div>
                  <h4>{{ submission.assignmentTitle }}</h4>

                  <p>
                    Submitted:
                    {{
                      new Date(submission.submittedAt)
                        .toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                    }}
                  </p>

                  <small>
                    Grade: {{ submission.grade }}
                  </small>

                  <div v-if="submission.fileLink" class="file-preview">
                    <a
                      :href="submission.fileLink"
                      target="_blank"
                      class="activity-link"
                    >
                      Open Submitted File
                    </a>
                  </div>
                </div>

                <span class="status completedStatus">
                  Completed
                </span>
              </div>
            </div>
          </div>
        </template>

        <template v-if="activeTab === 'announcements'">
          <div class="panel full">
            <h3>
              Announcements for {{ currentUser.course }} - {{ currentUser.year_level }}
            </h3>

            <div
              v-if="filteredAnnouncements.length === 0"
              class="empty"
            >
              <div>
                <div class="empty-icon">📢</div>

                <h2>No announcements yet</h2>

                <p>
                  Your instructor has not posted announcements for your course and year level yet.
                </p>
              </div>
            </div>

            <div
              v-else
              class="announcement-list"
            >
              <div
                v-for="announcement in filteredAnnouncements"
                :key="announcement.announcementId"
                class="announcement-item"
              >
                <div>
                  <h4>{{ announcement.title }}</h4>

                  <p>
                    {{ announcement.course }}
                    •
                    {{ announcement.yearLevel }}
                  </p>

                  <small>
                    Posted:
                    {{
                      new Date(announcement.createdAt)
                        .toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                    }}
                  </small>

                  <div class="announcement-message">
                    {{ announcement.message }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="activeTab === 'settings'">
          <div class="main-grid">
            <div class="panel">
              <h3>Profile Settings</h3>

              <label>Full Name</label>
              <input
                v-model="profileForm.full_name"
                type="text"
                placeholder="Enter full name"
              />

              <label>Email</label>
              <input
                v-model="profileForm.email"
                type="email"
                placeholder="Enter email"
              />

              <label>Course</label>
              <select v-model="profileForm.course">
                <option value="">Select Course</option>
                <option>BSIT</option>
                <option>BSIS</option>
                <option>BSCS</option>
              </select>

              <label>Year Level</label>
              <select v-model="profileForm.year_level">
                <option value="">Select Year</option>
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
              </select>

              <label>Change Password</label>
              <input
                v-model="profileForm.password"
                type="password"
                placeholder="Enter new password"
              />

              <button class="save-btn" @click="saveProfile">
                Save Profile
              </button>

              <button class="reset-btn" @click="resetProfile">
                Reset
              </button>
            </div>

            <div class="panel">
              <h3>Profile Preview</h3>

              <div class="preview-card">
                <div class="preview-avatar">👤</div>

                <h2>{{ currentUser.full_name }}</h2>

                <p>{{ currentUser.email }}</p>

                <span class="role-badge">
                  Student
                </span>
              </div>

              <div class="info-row">
                <span>Student ID</span>
                <strong>{{ currentUser.student_id }}</strong>
              </div>

              <div class="info-row">
                <span>Course</span>
                <strong>{{ currentUser.course }}</strong>
              </div>

              <div class="info-row">
                <span>Year Level</span>
                <strong>{{ currentUser.year_level }}</strong>
              </div>
            </div>
          </div>
        </template>

        <div
          v-if="selectedDescription"
          class="modal-bg"
        >
          <div class="modal">
            <h2>Assignment Description</h2>

            <p>{{ selectedDescription.title }}</p>

            <div class="description-box">
              <template v-if="selectedDescription.description">
                <a
                  v-if="
                    selectedDescription.description.includes('http://') ||
                    selectedDescription.description.includes('https://')
                  "
                  :href="selectedDescription.description"
                  target="_blank"
                  class="activity-link"
                >
                  Open Activity File
                </a>

                <span v-else>
                  {{ selectedDescription.description }}
                </span>
              </template>

              <span v-else>
                No description provided.
              </span>
            </div>

            <div class="modal-actions">
              <button
                class="cancel"
                @click="selectedDescription = null"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="selectedAssignment"
          class="modal-bg"
        >
          <div class="modal">
            <h2>
              {{
                isEditingSubmission
                  ? 'Edit Submission'
                  : 'Submit Assignment'
              }}
            </h2>

            <p>{{ selectedAssignment.title }}</p>

            <label>Your Answer</label>

            <textarea
              v-model="submissionForm.answer"
              placeholder="Write your answer"
            ></textarea>

            <label>File Link</label>

            <input
              v-model="submissionForm.fileLink"
              placeholder="Paste file link or leave empty if uploading"
            />

            <label>Upload File</label>

            <input
              type="file"
              class="file-input"
              @change="handleFileChange"
            />

            <small
              v-if="selectedFile"
              class="selected-file"
            >
              Selected file: {{ selectedFile.name }}
            </small>

            <div class="modal-actions">
              <button
                class="cancel"
                @click="closeSubmitModal"
              >
                Cancel
              </button>

              <button
                class="submit"
                :disabled="isUploadingFile"
                @click="submitAssignment"
              >
                {{
                  isUploadingFile
                    ? 'Uploading...'
                    : isEditingSubmission
                      ? 'Update Submission'
                      : 'Submit'
                }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </section>
  </main>
</template>

<style scoped>
*{
  margin:0;
  padding:0;
  box-sizing:border-box;
  font-family:Arial,sans-serif;
}

.page{
  width:100%;
  min-height:100vh;
  display:flex;
  background:#eef2f7;
}

.sidebar{
  width:250px;
  min-height:100vh;
  background:#020817;
  color:white;
  padding:20px 16px;
  display:flex;
  flex-direction:column;
  flex-shrink:0;
}

.sidebar h1{
  font-size:20px;
  font-weight:900;
  margin-bottom:34px;
}

.menu{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.nav{
  width:100%;
  height:48px;
  border:none;
  border-radius:14px;
  background:transparent;
  color:white;
  text-align:left;
  padding:0 16px;
  font-size:15px;
  font-weight:700;
  cursor:pointer;
}

.nav.active{
  background:#2563eb;
}

.logout-btn{
  width:100%;
  height:48px;
  border:none;
  border-radius:14px;
  background:#ef4444;
  color:white;
  font-size:15px;
  font-weight:800;
  cursor:pointer;
  margin-top:auto;
}

.content{
  flex:1;
  height:100vh;
  padding:16px 24px 24px;
  overflow-y:auto;
}

.notification{
  position:fixed;
  top:20px;
  right:20px;
  padding:14px 18px;
  border-radius:12px;
  color:white;
  font-weight:700;
  z-index:9999;
  animation:slideIn .25s ease;
  box-shadow:0 10px 25px rgba(0,0,0,0.2);
}

.notification.success{
  background:#16a34a;
}

.notification.error{
  background:#dc2626;
}

@keyframes slideIn{
  from{
    opacity:0;
    transform:translateY(-10px);
  }

  to{
    opacity:1;
    transform:translateY(0);
  }
}

.topbar{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  margin-bottom:18px;
}

.topbar h2{
  font-size:34px;
  font-weight:900;
  color:#020817;
}

.topbar p{
  color:#64748b;
  margin-top:8px;
  font-size:15px;
}

.profile{
  width:56px;
  height:56px;
  border-radius:50%;
  background:white;
  display:grid;
  place-items:center;
  font-size:24px;
}

.cards{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:16px;
  margin-bottom:18px;
}

.card{
  background:white;
  border-radius:18px;
  padding:20px;
  display:flex;
  align-items:center;
  gap:16px;
}

.icon{
  width:56px;
  height:56px;
  border-radius:16px;
  background:#dbeafe;
  display:grid;
  place-items:center;
  font-size:24px;
  flex-shrink:0;
}

.green{
  background:#dcfce7;
}

.orange{
  background:#ffedd5;
}

.purple{
  background:#ede9fe;
}

.card span{
  color:#64748b;
  font-size:15px;
  font-weight:700;
}

.card h3{
  margin-top:6px;
  font-size:24px;
  font-weight:900;
  color:#020817;
}

.main-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:16px;
}

.panel{
  background:white;
  border-radius:18px;
  padding:22px;
}

.panel h3{
  margin-bottom:18px;
  font-size:22px;
  font-weight:900;
  color:#020817;
}

.full{
  width:100%;
}

.info-row,
.message{
  background:#f8fafc;
  border-radius:14px;
  padding:16px;
  margin-bottom:12px;
}

.info-row{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
}

.info-row span{
  color:#64748b;
  font-size:14px;
  font-weight:700;
}

.info-row strong{
  color:#020817;
  font-size:15px;
  font-weight:800;
}

.message{
  color:#334155;
  line-height:1.6;
  font-size:15px;
}

label{
  display:block;
  margin-bottom:6px;
  font-size:14px;
  font-weight:800;
  color:#020817;
}

input,
select{
  width:100%;
  height:44px;
  border:1px solid #cbd5e1;
  border-radius:12px;
  padding:0 12px;
  font-size:14px;
  margin-bottom:12px;
  outline:none;
  background:white;
}

.save-btn,
.reset-btn{
  width:100%;
  height:46px;
  border:none;
  border-radius:12px;
  font-size:15px;
  font-weight:800;
  cursor:pointer;
}

.save-btn{
  background:#2563eb;
  color:white;
  margin-bottom:10px;
}

.reset-btn{
  background:#e2e8f0;
  color:#020817;
}

.preview-card{
  background:#f8fafc;
  border-radius:14px;
  padding:24px;
  text-align:center;
  margin-bottom:14px;
}

.preview-avatar{
  width:64px;
  height:64px;
  border-radius:50%;
  background:#dbeafe;
  display:grid;
  place-items:center;
  margin:0 auto 14px;
  font-size:30px;
}

.preview-card h2{
  font-size:22px;
  font-weight:900;
  color:#020817;
  margin-bottom:6px;
}

.preview-card p{
  color:#64748b;
  margin-bottom:12px;
  font-size:15px;
}

.role-badge{
  display:inline-block;
  padding:8px 12px;
  border-radius:999px;
  background:#dcfce7;
  color:#166534;
  font-size:12px;
  font-weight:800;
}

.assignment-list,
.announcement-list{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.assignment-item,
.announcement-item{
  background:#f8fafc;
  border-radius:14px;
  padding:16px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
}

.assignment-item h4,
.announcement-item h4{
  font-size:17px;
  color:#020817;
  margin-bottom:4px;
}

.assignment-item p,
.announcement-item p{
  color:#64748b;
  font-size:14px;
  margin-bottom:4px;
}

.assignment-item small,
.announcement-item small{
  font-size:13px;
  color:#0f172a;
}

.announcement-message,
.description-box{
  margin-top:12px;
  background:white;
  border-radius:12px;
  padding:14px;
  line-height:1.6;
  color:#334155;
}

.file-preview{
  margin-top:10px;
}

.activity-link{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding:10px 16px;
  border-radius:10px;
  background:#2563eb;
  color:white;
  font-weight:700;
  text-decoration:none;
  transition:0.2s;
}

.activity-link:hover{
  background:#1d4ed8;
}

.description-btn{
  margin-top:10px;
  border:none;
  border-radius:10px;
  padding:8px 12px;
  background:#e0e7ff;
  color:#3730a3;
  font-weight:800;
  cursor:pointer;
}

.actions{
  display:flex;
  align-items:center;
  gap:8px;
}

.submit-btn,
.edit-submit-btn{
  border:none;
  border-radius:10px;
  padding:10px 14px;
  color:white;
  font-weight:800;
  cursor:pointer;
}

.submit-btn{
  background:#2563eb;
}

.edit-submit-btn{
  background:#0f172a;
}

.status{
  padding:8px 12px;
  border-radius:999px;
  font-size:12px;
  font-weight:800;
}

.pending{
  background:#fef3c7;
  color:#92400e;
}

.completedStatus{
  background:#dcfce7;
  color:#166534;
}

.empty{
  min-height:240px;
  border:1px dashed #cbd5e1;
  border-radius:14px;
  background:#f8fafc;
  display:grid;
  place-items:center;
  text-align:center;
  padding:20px;
}

.empty-icon{
  font-size:42px;
  margin-bottom:8px;
}

.modal-bg{
  position:fixed;
  inset:0;
  background:rgba(2,8,23,0.65);
  display:grid;
  place-items:center;
  padding:18px;
  z-index:999;
}

.modal{
  width:100%;
  max-width:460px;
  background:white;
  border-radius:18px;
  padding:22px;
}

.modal h2{
  margin-bottom:8px;
  font-size:24px;
  font-weight:900;
}

.modal p{
  color:#64748b;
  margin-bottom:16px;
}

.modal label{
  display:block;
  margin-bottom:6px;
  font-size:14px;
  font-weight:800;
  color:#020817;
}

.modal textarea,
.modal input{
  width:100%;
  border:1px solid #cbd5e1;
  border-radius:12px;
  padding:12px;
  margin-bottom:14px;
  font-size:14px;
}

.modal textarea{
  height:110px;
  resize:none;
}

.file-input{
  height:auto;
  padding:12px;
  cursor:pointer;
}

.selected-file{
  display:block;
  color:#334155;
  font-size:13px;
  font-weight:700;
  margin-bottom:12px;
}

.modal-actions{
  display:flex;
  gap:10px;
}

.cancel,
.submit{
  width:100%;
  height:44px;
  border:none;
  border-radius:12px;
  font-weight:800;
  cursor:pointer;
}

.cancel{
  background:#e2e8f0;
  color:#020817;
}

.submit{
  background:#2563eb;
  color:white;
}

.submit:disabled{
  opacity:0.7;
  cursor:not-allowed;
}

@media(max-width:1100px){
  .cards{
    grid-template-columns:1fr 1fr;
  }

  .main-grid{
    grid-template-columns:1fr;
  }
}

@media(max-width:800px){
  .page{
    flex-direction:column;
  }

  .sidebar{
    width:100%;
    min-height:auto;
  }

  .content{
    height:auto;
    padding:16px;
  }

  .cards{
    grid-template-columns:1fr;
  }

  .topbar{
    flex-direction:column;
    gap:14px;
  }

  .assignment-item,
  .announcement-item{
    flex-direction:column;
    align-items:flex-start;
  }

  .info-row{
    flex-direction:column;
    align-items:flex-start;
  }

  .actions{
    width:100%;
    justify-content:space-between;
  }
}
</style>