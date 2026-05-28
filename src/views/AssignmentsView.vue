<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()

const assignments = ref([])
const submissions = ref([])
const activeTab = ref('assignments')
const editingId = ref(null)
const isLoading = ref(false)
const isUploading = ref(false)
const showLogoutModal = ref(false)

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const form = ref({
  assignmentId: '',
  title: '',
  course: '',
  yearLevel: '',
  deadline: '',
  description: '',
  activityFile: null
})

const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    message,
    type
  }

  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

const formatDescription = (text) => {
  if (!text) return ''

  const urlRegex = /(https?:\/\/[^\s]+)/g

  return text.replace(
    urlRegex,
    '<a href="$1" target="_blank" class="activity-link">Open Activity File</a>'
  )
}

const uploadActivityFile = async (file) => {
  if (!file) return null

  isUploading.value = true

  const safeFileName = file.name
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.-]/g, '')

  const filePath = `${Date.now()}-${safeFileName}`

  const { error: uploadError } = await supabase.storage
    .from('assignments')
    .upload(filePath, file)

  if (uploadError) {
    console.log(uploadError)

    showToast(
      'Failed to upload activity file.',
      'error'
    )

    isUploading.value = false
    return null
  }

  const { data } = supabase.storage
    .from('assignments')
    .getPublicUrl(filePath)

  isUploading.value = false

  return data.publicUrl
}

const loadData = async () => {
  isLoading.value = true

  const { data: assignmentData, error: assignmentError } = await supabase
    .from('assignments')
    .select('*')
    .order('created_at', { ascending: false })

  if (!assignmentError && assignmentData) {
    assignments.value = assignmentData.map(item => ({
      assignmentId: item.id,
      title: item.title,
      course: item.course,
      yearLevel: item.year_level,
      deadline: item.deadline,
      description: item.description,
      createdAt: item.created_at
    }))
  }

  const { data: submissionData, error: submissionError } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (!submissionError && submissionData) {
    submissions.value = submissionData.map(item => ({
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
    }))
  }

  isLoading.value = false
}

onMounted(async () => {
  await loadData()
})

const totalAssignments = computed(() =>
  assignments.value.length
)

const totalSubmissions = computed(() =>
  submissions.value.length
)

const totalPending = computed(() => {
  return assignments.value.filter(assignment => {
    const hasSubmission = submissions.value.some(
      submission =>
        submission.assignmentId === assignment.assignmentId
    )

    return !hasSubmission
  }).length
})

const totalCompleted = computed(() => {
  return submissions.value.filter(
    submission =>
      submission.grade &&
      submission.grade !== 'Not graded'
  ).length
})

const resetForm = () => {
  form.value = {
    assignmentId: '',
    title: '',
    course: '',
    yearLevel: '',
    deadline: '',
    description: '',
    activityFile: null
  }

  editingId.value = null
}

const handleActivityFileChange = (event) => {
  form.value.activityFile = event.target.files[0]
}

const createAssignment = async () => {
  if (
    !form.value.title ||
    !form.value.course ||
    !form.value.yearLevel ||
    !form.value.deadline ||
    (!form.value.description && !form.value.activityFile)
  ) {
    showToast(
      'Please fill in all assignment information.',
      'error'
    )
    return
  }

  let finalDescription = form.value.description

  if (form.value.activityFile) {
    const uploadedFileUrl = await uploadActivityFile(
      form.value.activityFile
    )

    if (!uploadedFileUrl) return

    finalDescription = finalDescription
      ? `${finalDescription}\n${uploadedFileUrl}`
      : uploadedFileUrl
  }

  if (editingId.value) {
    const { error } = await supabase
      .from('assignments')
      .update({
        title: form.value.title,
        course: form.value.course,
        year_level: form.value.yearLevel,
        deadline: form.value.deadline,
        description: finalDescription
      })
      .eq('id', editingId.value)

    if (error) {
      console.log(error)

      showToast(
        'Failed to update assignment.',
        'error'
      )

      return
    }
  } else {
    const { error } = await supabase
      .from('assignments')
      .insert([
        {
          title: form.value.title,
          course: form.value.course,
          year_level: form.value.yearLevel,
          deadline: form.value.deadline,
          description: finalDescription
        }
      ])

    if (error) {
      console.log(error)

      showToast(
        'Failed to create assignment.',
        'error'
      )

      return
    }
  }

  await loadData()
  resetForm()

  showToast(
    'Assignment saved successfully.'
  )
}

const editAssignment = (assignment) => {
  form.value = {
    assignmentId: assignment.assignmentId,
    title: assignment.title,
    course: assignment.course || '',
    yearLevel: assignment.yearLevel || '',
    deadline: assignment.deadline,
    description: assignment.description || '',
    activityFile: null
  }

  editingId.value = assignment.assignmentId
}

const deleteAssignment = async (assignment) => {
  if (!confirm('Delete this assignment?')) return

  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', assignment.assignmentId)

  if (error) {
    console.log(error)

    showToast(
      'Failed to delete assignment.',
      'error'
    )

    return
  }

  await loadData()

  showToast(
    'Assignment deleted successfully.'
  )
}

const updateGrade = async (submission, grade) => {
  const { error } = await supabase
    .from('submissions')
    .update({
      grade
    })
    .eq('id', submission.submissionId)

  if (error) {
    console.log(error)

    showToast(
      'Failed to update grade.',
      'error'
    )

    return
  }

  await loadData()

  showToast(
    'Grade updated successfully.'
  )
}

const openLogoutModal = () => {
  showLogoutModal.value = true
}

const cancelLogout = () => {
  showLogoutModal.value = false
}

const confirmLogout = () => {
  localStorage.removeItem('currentUser')

  showLogoutModal.value = false

  showToast(
    'Logged out successfully.'
  )

  setTimeout(() => {
    router.push('/')
  }, 1000)
}
</script>

<template>
  <main class="page">
    <aside class="sidebar">
      <h1>Student Tracker</h1>

      <nav class="menu">
        <router-link to="/dashboard" class="nav">
          Dashboard
        </router-link>

        <router-link to="/students" class="nav">
          Students
        </router-link>

        <router-link to="/assignments" class="nav active">
          Assignments
        </router-link>

        <router-link to="/announcements" class="nav">
          Announcements
        </router-link>

        <router-link to="/settings" class="nav">
          Settings
        </router-link>
      </nav>

      <button class="logout-btn" @click="openLogoutModal">
        Logout
      </button>
    </aside>

    <div
      v-if="showLogoutModal"
      class="modal-overlay"
    >
      <div class="logout-modal">
        <div class="modal-icon">
          🚪
        </div>

        <h2>
          Logout Confirmation
        </h2>

        <p>
          Are you sure you want to logout?
        </p>

        <div class="modal-actions">
          <button
            class="cancel-logout"
            @click="cancelLogout"
          >
            Cancel
          </button>

          <button
            class="confirm-logout"
            @click="confirmLogout"
          >
            Yes, Logout
          </button>
        </div>
      </div>
    </div>

    <section class="content">
      <div
        v-if="toast.show"
        :class="['toast', toast.type]"
      >
        {{ toast.message }}
      </div>

      <div class="topbar">
        <div>
          <h2>Assignments</h2>

          <p>
            Create assignments for specific courses and year levels.
          </p>
        </div>

        <div class="profile">
          👤
        </div>
      </div>

      <div class="cards">
        <div class="card">
          <div class="icon">
            📄
          </div>

          <div>
            <span>Total Assignments</span>
            <h3>{{ totalAssignments }}</h3>
          </div>
        </div>

        <div class="card">
          <div class="icon orange">
            ⏳
          </div>

          <div>
            <span>Pending Tasks</span>
            <h3>{{ totalPending }}</h3>
          </div>
        </div>

        <div class="card">
          <div class="icon green">
            ✅
          </div>

          <div>
            <span>Graded Tasks</span>
            <h3>{{ totalCompleted }}</h3>
          </div>
        </div>

        <div class="card">
          <div class="icon purple">
            📝
          </div>

          <div>
            <span>Submissions</span>
            <h3>{{ totalSubmissions }}</h3>
          </div>
        </div>
      </div>

      <div class="tabs">
        <button
          :class="{ activeTab: activeTab === 'assignments' }"
          @click="activeTab = 'assignments'"
        >
          Manage Assignments
        </button>

        <button
          :class="{ activeTab: activeTab === 'submissions' }"
          @click="activeTab = 'submissions'"
        >
          Student Submissions
        </button>
      </div>

      <div v-if="isLoading" class="panel full">
        <h3>Loading...</h3>
      </div>

      <template v-else>
        <template v-if="activeTab === 'assignments'">
          <div class="main-grid">
            <div class="panel">
              <h3>
                {{
                  editingId
                    ? 'Edit Assignment'
                    : 'Create Assignment'
                }}
              </h3>

              <label>Assignment ID</label>

              <input
                :value="form.assignmentId || 'Auto Generated'"
                disabled
              />

              <label>Title</label>

              <input
                v-model="form.title"
                type="text"
                placeholder="Example: Final Project"
              />

              <label>Course</label>

              <select v-model="form.course">
                <option value="">Select Course</option>
                <option>BSIT</option>
                <option>BSIS</option>
                <option>BSCS</option>
              </select>

              <label>Year Level</label>

              <select v-model="form.yearLevel">
                <option value="">Select Year Level</option>
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
              </select>

              <label>Deadline</label>

              <input
                v-model="form.deadline"
                type="date"
              />

              <label>Description</label>

              <textarea
                v-model="form.description"
                placeholder="Enter assignment instructions"
              ></textarea>

              <label>Upload Activity File</label>

              <input
                type="file"
                class="file-upload"
                @change="handleActivityFileChange"
              />

              <small
                v-if="form.activityFile"
                class="selected-file"
              >
                Selected file: {{ form.activityFile.name }}
              </small>

              <button
                class="save-btn"
                :disabled="isUploading"
                @click="createAssignment"
              >
                {{
                  isUploading
                    ? 'Uploading...'
                    : editingId
                      ? 'Update Assignment'
                      : 'Create Assignment'
                }}
              </button>

              <button
                v-if="editingId"
                class="cancel-btn"
                @click="resetForm"
              >
                Cancel Edit
              </button>
            </div>

            <div class="panel">
              <h3>Assignment List</h3>

              <div
                v-if="assignments.length === 0"
                class="empty"
              >
                <div>
                  <div class="empty-icon">
                    📚
                  </div>

                  <h2>No assignments yet</h2>

                  <p>
                    Create your first assignment using the form.
                  </p>
                </div>
              </div>

              <div
                v-else
                class="assignment-list"
              >
                <div
                  v-for="assignment in assignments"
                  :key="assignment.assignmentId"
                  class="assignment-item"
                >
                  <div class="assignment-content">
                    <h4>{{ assignment.title }}</h4>

                    <p>
                      {{ assignment.course }}
                      •
                      {{ assignment.yearLevel || 'No year level' }}
                    </p>

                    <div
                      v-if="assignment.description"
                      class="description"
                      v-html="formatDescription(assignment.description)"
                    ></div>

                    <small class="due-date">
                      Due: {{ assignment.deadline }}
                    </small>
                  </div>

                  <div class="actions">
                    <button
                      class="edit"
                      @click="editAssignment(assignment)"
                    >
                      Edit
                    </button>

                    <button
                      class="delete"
                      @click="deleteAssignment(assignment)"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="activeTab === 'submissions'">
          <div class="panel full">
            <h3>Student Submissions</h3>

            <div
              v-if="submissions.length === 0"
              class="empty"
            >
              <div>
                <div class="empty-icon">
                  📝
                </div>

                <h2>No submissions yet</h2>

                <p>
                  Student submissions will appear here.
                </p>
              </div>
            </div>

            <div
              v-else
              class="table-wrapper"
            >
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Assignment</th>
                    <th>Answer</th>
                    <th>File</th>
                    <th>Submitted</th>
                    <th>Grade</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="submission in submissions"
                    :key="submission.submissionId"
                  >
                    <td>{{ submission.studentName }}</td>

                    <td>{{ submission.assignmentTitle }}</td>

                    <td>{{ submission.answer || 'No answer' }}</td>

                    <td>
                      <a
                        v-if="submission.fileLink"
                        :href="submission.fileLink"
                        target="_blank"
                      >
                        Open File
                      </a>

                      <span v-else>No file</span>
                    </td>

                    <td>{{ submission.submittedAt }}</td>

                    <td>
                      <input
                        class="grade-input"
                        :value="submission.grade"
                        placeholder="Grade"
                        @change="updateGrade(submission, $event.target.value)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </template>
    </section>
  </main>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
}

.page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  background: #eef2f7;
}

.sidebar {
  width: 250px;
  min-height: 100vh;
  background: #020817;
  color: white;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar h1 {
  font-size: 20px;
  font-weight: 900;
  margin-bottom: 34px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  text-decoration: none;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 15px;
  font-weight: 700;
}

.nav.active {
  background: #2563eb;
}

.logout-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 14px;
  background: #ef4444;
  color: white;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  margin-top: auto;
}

.content {
  flex: 1;
  height: 100vh;
  padding: 16px 24px 24px;
  overflow-y: auto;
}

.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 14px 22px;
  border-radius: 14px;
  color: white;
  font-weight: 800;
  z-index: 9999;
  box-shadow: 0 10px 25px rgba(0, 0, 0, .15);
  animation: slideIn .3s ease;
}

.toast.success {
  background: #22c55e;
}

.toast.error {
  background: #ef4444;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  padding: 20px;
}

.logout-modal {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 22px;
  padding: 28px;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  animation: popIn .25s ease;
}

.modal-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #fee2e2;
  color: #b91c1c;
  display: grid;
  place-items: center;
  font-size: 30px;
  margin: 0 auto 14px;
}

.logout-modal h2 {
  font-size: 24px;
  font-weight: 900;
  color: #020817;
  margin-bottom: 8px;
}

.logout-modal p {
  color: #64748b;
  font-size: 15px;
  margin-bottom: 22px;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.cancel-logout,
.confirm-logout {
  flex: 1;
  height: 46px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.cancel-logout {
  background: #e2e8f0;
  color: #020817;
}

.confirm-logout {
  background: #ef4444;
  color: white;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.94);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}

.topbar h2 {
  font-size: 34px;
  font-weight: 900;
  color: #020817;
}

.topbar p {
  color: #64748b;
  margin-top: 8px;
  font-size: 15px;
}

.profile {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: white;
  display: grid;
  place-items: center;
  font-size: 24px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 18px;
}

.card {
  background: white;
  border-radius: 18px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #dbeafe;
  display: grid;
  place-items: center;
  font-size: 24px;
}

.green {
  background: #dcfce7;
}

.orange {
  background: #ffedd5;
}

.purple {
  background: #ede9fe;
}

.card span {
  color: #64748b;
  font-size: 15px;
  font-weight: 700;
}

.card h3 {
  margin-top: 6px;
  font-size: 24px;
  font-weight: 900;
  color: #020817;
}

.tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.tabs button {
  height: 46px;
  border: none;
  border-radius: 12px;
  padding: 0 18px;
  background: white;
  color: #020817;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.tabs .activeTab {
  background: #2563eb;
  color: white;
}

.main-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  align-items: start;
}

.panel {
  background: white;
  border-radius: 18px;
  padding: 22px;
}

.panel h3 {
  margin-bottom: 18px;
  font-size: 22px;
  font-weight: 900;
  color: #020817;
}

.full {
  width: 100%;
}

label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 800;
  color: #020817;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 0 12px;
  font-size: 14px;
  margin-bottom: 12px;
  background: white;
}

input,
select {
  height: 44px;
}

textarea {
  height: 90px;
  padding: 12px;
  resize: none;
}

.file-upload {
  height: auto;
  padding: 10px;
  cursor: pointer;
}

.selected-file {
  display: block;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 12px;
}

.save-btn,
.cancel-btn {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.save-btn {
  background: #2563eb;
  color: white;
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.cancel-btn {
  background: #e2e8f0;
  color: #020817;
  margin-top: 10px;
}

.empty {
  min-height: 240px;
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  background: #f8fafc;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 20px;
}

.empty-icon {
  font-size: 42px;
  margin-bottom: 8px;
}

.assignment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.assignment-item {
  background: #f8fafc;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.assignment-content {
  flex: 1;
}

.assignment-item h4 {
  font-size: 17px;
  color: #020817;
  margin-bottom: 4px;
}

.assignment-item p {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 4px;
}

.description {
  color: #334155;
  font-size: 13px;
  line-height: 1.6;
  margin-top: 6px;
  white-space: pre-line;
}

.description :deep(.activity-link) {
  display: inline-block;
  margin-top: 6px;
  color: #2563eb;
  font-weight: 800;
  text-decoration: none;
}

.description :deep(.activity-link:hover) {
  text-decoration: underline;
}

.due-date {
  display: block;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  margin-top: 6px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit {
  border: none;
  border-radius: 10px;
  padding: 9px 12px;
  background: #fef3c7;
  color: #92400e;
  font-weight: 800;
  cursor: pointer;
}

.delete {
  border: none;
  border-radius: 10px;
  padding: 9px 12px;
  background: #fee2e2;
  color: #b91c1c;
  font-weight: 800;
  cursor: pointer;
}

.table-wrapper {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

th,
td {
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  font-size: 14px;
}

th {
  background: #f8fafc;
  color: #475569;
}

.grade-input {
  width: 90px;
  margin: 0;
}

a {
  color: #2563eb;
  font-weight: 800;
  text-decoration: none;
}

@media (max-width: 1100px) {
  .cards {
    grid-template-columns: 1fr 1fr;
  }

  .main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 800px) {
  .page {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    min-height: auto;
  }

  .content {
    height: auto;
    padding: 16px;
  }

  .topbar {
    flex-direction: column;
    gap: 14px;
  }

  .cards {
    grid-template-columns: 1fr;
  }

  .tabs {
    flex-direction: column;
  }

  .assignment-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>