import type { Prisma } from '@prisma/client';
type User = Prisma.UserGetPayload<{
  select: { id: true; email: true };
}>;

function renderUser(user: User, container: HTMLDivElement): void {
  const userDiv = document.createElement('div');
  userDiv.textContent = `${user.id}: ${user.email}`;
  container.appendChild(userDiv);
}

async function fetchUsers(usersDiv: HTMLDivElement ) {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const users = await response.json();
    usersDiv.innerHTML = ''; // Clear existing users
    users.forEach((user: User) => {
      renderUser(user, usersDiv);
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
}

export function setupRegisterUser(element: HTMLButtonElement) {
  const emailInput = document.querySelector<HTMLInputElement>('#email');
  const usersDiv = document.querySelector<HTMLDivElement>('#users');

  if (!emailInput || !usersDiv) {
    console.error('Required elements not found in the DOM.');
    return;
  }

  fetchUsers(usersDiv);

  element.addEventListener('click', () => {
    const email = emailInput.value.trim();
    if (email) {
      fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      .then(response => {
        if (!response.ok) {
          console.log('User creation failed:', response.statusText);
        }
        return response.json();
      })
      .then(user => {
        console.log('User created:', user);
        renderUser(user, usersDiv);
        emailInput.value = '';
      }).catch(error => {
        console.error('Error creating user:', error);
      });
    } else {
      alert('Please enter a valid email address.');
    }
  });
}

