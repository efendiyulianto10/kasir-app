export type UserRole = 'owner' | 'manager_wilayah' | 'pic_cabang' | 'kasir';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  regionId?: string; // for manager_wilayah
  branchId?: string; // for pic_cabang and kasir
  phone?: string;
}

// Demo users - in production, this would be from a database
export const demoUsers: User[] = [
  // Owner - full access
  {
    id: 'owner1',
    username: 'owner',
    password: 'owner123',
    name: 'Pemilik SMP',
    role: 'owner',
    phone: '6281234567890',
  },
  // Manager Wilayah
  {
    id: 'mgr1',
    username: 'budi',
    password: 'budi123',
    name: 'Budi Santoso',
    role: 'manager_wilayah',
    regionId: 'r1', // Jakarta Selatan
    phone: '6281234567890',
  },
  {
    id: 'mgr2',
    username: 'siti',
    password: 'siti123',
    name: 'Siti Rahayu',
    role: 'manager_wilayah',
    regionId: 'r2', // Jakarta Timur
    phone: '6281234567891',
  },
  {
    id: 'mgr3',
    username: 'ahmad',
    password: 'ahmad123',
    name: 'Ahmad Fauzi',
    role: 'manager_wilayah',
    regionId: 'r3', // Depok
    phone: '6281234567892',
  },
  // PIC Cabang
  {
    id: 'pic1',
    username: 'andi',
    password: 'andi123',
    name: 'Andi',
    role: 'pic_cabang',
    branchId: 'b1', // SMP Tebet 1
    phone: '6281111111111',
  },
  {
    id: 'pic2',
    username: 'rina',
    password: 'rina123',
    name: 'Rina',
    role: 'pic_cabang',
    branchId: 'b2', // SMP Tebet 2
    phone: '6281111111112',
  },
  {
    id: 'pic3',
    username: 'doni',
    password: 'doni123',
    name: 'Doni',
    role: 'pic_cabang',
    branchId: 'b3', // SMP Cawang
    phone: '6281111111113',
  },
  // Kasir
  {
    id: 'kasir1',
    username: 'kasir1',
    password: 'kasir123',
    name: 'Kasir Tebet 1',
    role: 'kasir',
    branchId: 'b1',
  },
  {
    id: 'kasir2',
    username: 'kasir2',
    password: 'kasir123',
    name: 'Kasir Cawang',
    role: 'kasir',
    branchId: 'b3',
  },
];

export function getUsers(): User[] {
  try {
    const data = localStorage.getItem('smp_users');
    return data ? JSON.parse(data) : demoUsers;
  } catch {
    return demoUsers;
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem('smp_users', JSON.stringify(users));
}

export function authenticate(username: string, password: string): User | null {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  return user || null;
}

export function getCurrentUser(): User | null {
  try {
    const data = localStorage.getItem('smp_current_user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem('smp_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('smp_current_user');
  }
}

export function logout(): void {
  localStorage.removeItem('smp_current_user');
}

// Role labels
export const roleLabels: Record<UserRole, string> = {
  owner: '👑 Owner',
  manager_wilayah: '📍 Manager Wilayah',
  pic_cabang: '🏪 PIC Cabang',
  kasir: '🧑‍💼 Kasir',
};

// Role colors
export const roleColors: Record<UserRole, string> = {
  owner: 'bg-purple-100 text-purple-700 border-purple-200',
  manager_wilayah: 'bg-blue-100 text-blue-700 border-blue-200',
  pic_cabang: 'bg-green-100 text-green-700 border-green-200',
  kasir: 'bg-orange-100 text-orange-700 border-orange-200',
};
