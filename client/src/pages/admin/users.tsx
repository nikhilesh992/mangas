import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Shield, Ban, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

// Type definitions
type UserRole = "admin" | "moderator" | "user";
type UserStatus = "active" | "suspended" | "banned";

// Mock user data since user management isn't fully implemented in the backend yet
const mockUsers = [
  {
    id: "1",
    username: "admin",
    email: "admin@mangaverse.com",
    role: "admin",
    status: "active",
    createdAt: "2024-01-15T10:00:00Z",
    lastLogin: "2024-03-15T14:30:00Z",
    favoriteCount: 0,
    readingProgress: 0,
  },
  {
    id: "2", 
    username: "reader1",
    email: "reader1@example.com",
    role: "user",
    status: "active",
    createdAt: "2024-02-01T10:00:00Z",
    lastLogin: "2024-03-14T09:15:00Z",
    favoriteCount: 15,
    readingProgress: 8,
  },
  {
    id: "3",
    username: "reader2", 
    email: "reader2@example.com",
    role: "user",
    status: "banned",
    createdAt: "2024-02-15T10:00:00Z",
    lastLogin: "2024-03-10T16:45:00Z",
    favoriteCount: 3,
    readingProgress: 2,
  },
  {
    id: "4",
    username: "moderator",
    email: "mod@mangaverse.com", 
    role: "moderator",
    status: "active",
    createdAt: "2024-01-20T10:00:00Z",
    lastLogin: "2024-03-15T11:20:00Z",
    favoriteCount: 5,
    readingProgress: 12,
  }
];

interface MockUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin: string;
  favoriteCount: number;
  readingProgress: number;
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  // Since user management endpoints aren't fully implemented, using mock data
  const users = mockUsers;
  const isLoading = false;

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    banned: users.filter(u => u.status === "banned").length,
    admins: users.filter(u => u.role === "admin").length,
    moderators: users.filter(u => u.role === "moderator").length,
    regularUsers: users.filter(u => u.role === "user").length,
  };

  const handleStatusChange = (userId: string, newStatus: UserStatus) => {
    toast({ 
      title: "Status Updated", 
      description: `User status changed to ${newStatus}` 
    });
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    toast({ 
      title: "Role Updated", 
      description: `User role changed to ${newRole}` 
    });
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "admin": return "destructive";
      case "moderator": return "default";
      default: return "secondary";
    }
  };

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case "active": return "default";
      case "banned": return "destructive";
      case "suspended": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-8" data-testid="admin-users">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="users-title">
            User Management
          </h1>
          <p className="text-muted-foreground" data-testid="users-description">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        
        <Button data-testid="add-user-button">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card data-testid="total-users-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-primary mr-2" />
              <div>
                <p className="text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold">{userStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="active-users-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-2xl font-bold">{userStats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="banned-users-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Ban className="h-4 w-4 text-red-500 mr-2" />
              <div>
                <p className="text-sm font-medium">Banned</p>
                <p className="text-2xl font-bold">{userStats.banned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="admin-users-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-purple-500 mr-2" />
              <div>
                <p className="text-sm font-medium">Admins</p>
                <p className="text-2xl font-bold">{userStats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="mod-users-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-blue-500 mr-2" />
              <div>
                <p className="text-sm font-medium">Moderators</p>
                <p className="text-2xl font-bold">{userStats.moderators}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card data-testid="regular-users-stat">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-gray-500 mr-2" />
              <div>
                <p className="text-sm font-medium">Users</p>
                <p className="text-2xl font-bold">{userStats.regularUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Search users by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="users-search-input"
          />
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter} data-testid="role-filter">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="status-filter">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card data-testid="users-table-card">
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4" data-testid="users-loading">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-muted rounded h-16 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="users-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {user.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium" data-testid={`username-${user.id}`}>
                              {user.username}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`email-${user.id}`}>
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getRoleBadgeVariant(user.role as UserRole)}
                          data-testid={`role-badge-${user.id}`}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(user.status as UserStatus)}
                          data-testid={`status-badge-${user.id}`}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm" data-testid={`activity-${user.id}`}>
                          <p>{user.favoriteCount} favorites</p>
                          <p>{user.readingProgress} reading</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm" data-testid={`last-login-${user.id}`}>
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Select 
                            value={user.role} 
                            onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                            data-testid={`role-select-${user.id}`}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="moderator">Mod</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select 
                            value={user.status} 
                            onValueChange={(value) => handleStatusChange(user.id, value as UserStatus)}
                            data-testid={`status-select-${user.id}`}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspend</SelectItem>
                              <SelectItem value="banned">Ban</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8" data-testid="no-users-found">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Users Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                      ? "No users match your current filters"
                      : "No users in the system yet"
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
