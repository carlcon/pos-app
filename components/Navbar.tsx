'use client';

import { useAuth } from '@/context/AuthContext';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function Navbar() {
  const { user, logout, isSuperAdmin, isImpersonating, impersonatedPartner, exitImpersonation } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleExitImpersonation = async () => {
    await exitImpersonation();
  };

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/products', label: 'Products', icon: '📦' },
    { href: '/sales', label: 'Sales', icon: '💰' },
    { href: '/stock', label: 'Stock', icon: '📋' },
    { href: '/expenses', label: 'Expenses', icon: '💸' },
  ];

  const adminLinks = [
    { href: '/reports', label: 'Reports', icon: '📈' },
  ];
  
  // Super Admin only links
  const superAdminLinks = [
    { href: '/partners', label: 'Partners', icon: '🏢' },
  ];

  const showTenantNav = !isSuperAdmin || isImpersonating;

  return (
    <>
      {/* Impersonation Banner */}
      {isImpersonating && impersonatedPartner && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium sticky top-0 z-[60] shadow-md">
          <div className="flex items-center justify-center gap-4">
            <span>
              👁️ Viewing as <strong>{impersonatedPartner.name}</strong> ({impersonatedPartner.code})
            </span>
            <Button
              size="sm"
              color="warning"
              variant="flat"
              className="bg-white/20 hover:bg-white/30 text-white"
              onPress={handleExitImpersonation}
            >
              Exit Impersonation
            </Button>
          </div>
        </div>
      )}
      
      <nav className={`sticky ${isImpersonating ? 'top-[40px]' : 'top-0'} z-50 bg-white border-b border-gray-200 shadow-sm`}>
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-gradient-to-br from-[#049AE0] to-[#0B7FBF] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-shadow">
                  P
                </div>
                <span className="text-lg font-bold text-[#242832] hidden sm:block">POS Inventory</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-1">
                {showTenantNav && navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(link.href)
                        ? 'bg-[#049AE0]/10 text-[#049AE0]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#242832]'
                    }`}
                  >
                    <span className="mr-1.5">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
                {showTenantNav && user?.role === 'ADMIN' && adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(link.href)
                        ? 'bg-[#049AE0]/10 text-[#049AE0]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#242832]'
                    }`}
                  >
                    <span className="mr-1.5">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
                {/* Super Admin Only Links */}
                {isSuperAdmin && !isImpersonating && superAdminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(link.href)
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-purple-600 hover:bg-purple-50 hover:text-purple-800'
                    }`}
                  >
                    <span className="mr-1.5">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Partner Badge (for non-super-admin or when impersonating) */}
              {(user?.partner || isImpersonating) && (
                <div className="hidden md:flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                  <span>🏢</span>
                  <span>{isImpersonating ? impersonatedPartner?.name : user?.partner?.name}</span>
                </div>
              )}
              
              {/* Super Admin Badge */}
              {isSuperAdmin && !isImpersonating && (
                <div className="hidden md:flex items-center gap-1 px-3 py-1 bg-purple-100 rounded-full text-xs text-purple-700 font-medium">
                  <span>⚡</span>
                  <span>Super Admin</span>
                </div>
              )}
              
              {/* User Menu */}
              <Dropdown>
                <DropdownTrigger>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#049AE0] to-[#0B7FBF] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-semibold text-[#242832]">{user?.username}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </DropdownTrigger>
                <DropdownMenu aria-label="User menu">
                  <DropdownItem key="profile" className="h-14 gap-2">
                    <p className="font-semibold">Signed in as</p>
                    <p className="font-semibold text-[#049AE0]">{user?.username}</p>
                  </DropdownItem>
                  <DropdownItem key="settings">Settings</DropdownItem>
                  <DropdownItem key="logout" color="danger" onClick={handleLogout}>
                    Logout
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col gap-1">
                {showTenantNav && navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(link.href)
                        ? 'bg-[#049AE0]/10 text-[#049AE0]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#242832]'
                    }`}
                  >
                    <span className="mr-2">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
                {showTenantNav && user?.role === 'ADMIN' && adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(link.href)
                        ? 'bg-[#049AE0]/10 text-[#049AE0]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#242832]'
                    }`}
                  >
                    <span className="mr-2">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
                {/* Super Admin Mobile Links */}
                {isSuperAdmin && !isImpersonating && superAdminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(link.href)
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-purple-600 hover:bg-purple-50 hover:text-purple-800'
                    }`}
                  >
                    <span className="mr-2">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
