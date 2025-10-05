// Mock authentication for demo purposes (localStorage-based)

export function getMockUser() {
  let user = localStorage.getItem('flowbudget_user');
  if (!user) {
    user = { uid: crypto.randomUUID() };
    localStorage.setItem('flowbudget_user', JSON.stringify(user));
  } else {
    user = JSON.parse(user);
  }
  return user;
}

export function signOutMock() {
  localStorage.removeItem('flowbudget_user');
  window.location.reload();
}
