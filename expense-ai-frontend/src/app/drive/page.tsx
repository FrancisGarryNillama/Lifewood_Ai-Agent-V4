'use client';

import { Activity, ChevronRight, CheckCircle2, File, Folder, FolderOpen, Grid3X3, LayoutList, Loader2, LogOut, RefreshCw, Search, WifiOff } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { driveService } from '../../services/driveService';
import styles from './page.module.css';

type DriveItem = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  children?: DriveItem[];
};

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const LOGO_URL =
  'https://framerusercontent.com/images/BZSiFYgRc4wDUAuEybhJbZsIBQY.png';

function isFolder(item: DriveItem): boolean {
  return item.mimeType === FOLDER_MIME_TYPE;
}

function summarizeTree(items: DriveItem[]) {
  let folderCount = 0;
  let fileCount = 0;

  for (const item of items) {
    if (isFolder(item)) {
      folderCount += 1;
      const nested = summarizeTree(item.children ?? []);
      folderCount += nested.folderCount;
      fileCount += nested.fileCount;
    } else {
      fileCount += 1;
    }
  }

  return { folderCount, fileCount };
}

const GREETINGS = ['Good day, admin', 'Welcome back, admin', 'Hello, admin'];

const FOLDER_COLORS = [
  'rgba(245, 166, 35, 0.14)',
  'rgba(4, 98, 65, 0.10)',
  'rgba(88, 86, 214, 0.10)',
  'rgba(255, 59, 48, 0.08)',
  'rgba(0, 122, 255, 0.10)',
  'rgba(255, 149, 0, 0.10)',
];

const FOLDER_ICON_COLORS = [
  '#f5a623',
  '#046241',
  '#5856d6',
  '#ff3b30',
  '#007aff',
  '#ff9500',
];

function formatRelativeDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays < 7) return `Updated ${diffDays}d ago`;
  return `Updated ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function countDeepFiles(items: DriveItem[]): number {
  let count = 0;
  for (const item of items) {
    if (!isFolder(item)) count += 1;
    if (item.children?.length) count += countDeepFiles(item.children);
  }
  return count;
}

function useCyclingGreeting(intervalMs: number) {
  const [index, setIndex] = useState(0);
  const [animClass, setAnimClass] = useState('splitIn');

  useEffect(() => {
    const id = setInterval(() => {
      setAnimClass('splitOut');
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % GREETINGS.length);
        setAnimClass('splitIn');
      }, 500);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return { greeting: GREETINGS[index], animClass };
}

export default function DrivePage() {
  const router = useRouter();
  const [folders, setFolders] = useState<DriveItem[]>([]);
  const [viewMode, setViewMode] = useState<'tiles' | 'content'>('tiles');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { greeting, animClass } = useCyclingGreeting(15000);

  const deferredSearch = useDeferredValue(searchInput.trim().toLowerCase());

  useEffect(() => {
    setConnectionStatus(new URLSearchParams(window.location.search).get('status'));
  }, []);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const data = await driveService.listFiles();
        setFolders(data);
        setError(null);
        setLastSynced(new Date());
      } catch (err) {
        setError('Failed to load scanned Google Drive folders.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  const stats = summarizeTree(folders);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const data = await driveService.listFiles();
      setFolders(data);
      setLastSynced(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  }

  const rootFolders = useMemo(() => {
    if (!deferredSearch) return folders;
    return folders.filter((folder) => folder.name.toLowerCase().includes(deferredSearch));
  }, [deferredSearch, folders]);

  function openFolder(folderId: string) {
    router.push(`/drive/${folderId}`);
  }

  if (loading) {
    return (
      <main className={styles.pageShell}>
        <section className={styles.loadingState}>
          <Loader2 className={styles.spinner} size={32} />
          <h1>Loading your workspace</h1>
          <p>Syncing scanned folders from Google Drive&hellip;</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.pageShell}>
        <section className={styles.loadingState}>
          <WifiOff size={28} style={{ opacity: 0.6 }} />
          <h1>Unable to connect</h1>
          <p>{error}</p>
          <a className={styles.primaryAction} href="/">
            Return home
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.pageShell}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/drive">
          <img alt="Lifewood" className={styles.brandLogo} src={LOGO_URL} />
        </a>
        <nav className={styles.topbarNav}>
          <span className={styles.navLabel}>Dashboard</span>
        </nav>
        <div className={styles.topbarActions}>
          <a className={styles.signOut} href="/">
            <LogOut size={14} />
            Sign Out
          </a>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCard}>
          <div className={styles.heroCardGrid} />
          <div className={styles.heroTicker} aria-label="Always on never off">
            <div className={styles.heroTickerTrack}>
              <span>Always On Never Off • Always On Never Off • Always On Never Off • Always On Never Off •</span>
              <span aria-hidden="true">Always On Never Off • Always On Never Off • Always On Never Off • Always On Never Off •</span>
            </div>
          </div>
          <h1 className={`${styles.greetingText} ${animClass === 'splitIn' ? styles.splitIn : styles.splitOut}`}>
            {greeting}
          </h1>
          <p className={styles.heroSubtitle}>Select a scanned expense folder below to open its review workspace.</p>
          <div className={styles.heroMeta}>
            <span className={styles.heroDate}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            {lastSynced && (
              <span className={styles.heroSync}>
                <Activity size={12} />
                Last synced {lastSynced.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div className={styles.heroMetrics}>
          <article className={`${styles.metricCard} ${styles.metricCardGreen}`}>
            <div className={styles.metricHeader}>
              <FolderOpen className={styles.metricIcon} size={18} />
              <span className={styles.metricBadge}>{folders.length > 0 ? 'Active' : 'Empty'}</span>
            </div>
            <span>Top-level scans</span>
            <strong>{folders.length}</strong>
            <div className={styles.metricBar}>
              <div className={styles.metricBarFillGreen} style={{ width: `${Math.min(folders.length * 10, 100)}%` }} />
            </div>
          </article>
          <article className={`${styles.metricCard} ${styles.metricCardAmber}`}>
            <div className={styles.metricHeader}>
              <Folder className={styles.metricIcon} size={18} />
              <span className={styles.metricBadge}>{stats.folderCount} total</span>
            </div>
            <span>Nested folders</span>
            <strong>{stats.folderCount}</strong>
            <div className={styles.metricBar}>
              <div className={styles.metricBarFillAmber} style={{ width: `${Math.min(stats.folderCount * 5, 100)}%` }} />
            </div>
          </article>
          <article className={`${styles.metricCard} ${styles.metricCardBlue}`}>
            <div className={styles.metricHeader}>
              <File className={styles.metricIcon} size={18} />
              <span className={styles.metricBadge}>{stats.fileCount} indexed</span>
            </div>
            <span>Files indexed</span>
            <strong>{stats.fileCount}</strong>
            <div className={styles.metricBar}>
              <div className={styles.metricBarFillBlue} style={{ width: `${Math.min(stats.fileCount * 3, 100)}%` }} />
            </div>
          </article>
        </div>
      </section>

      {connectionStatus === 'success' ? (
        <section className={styles.statusBar}>
          <span className={styles.statusPill}><CheckCircle2 size={13} /> Connected</span>
          <p>Google Drive connected successfully. The scanned folders below are ready for review.</p>
        </section>
      ) : null}

      <section className={styles.controls}>
        <div className={styles.controlsIntro}>
          <h2>Expense Folders</h2>
          <p>{rootFolders.length} folder{rootFolders.length !== 1 ? 's' : ''} available</p>
        </div>
        <div className={styles.controlActions}>
          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={refreshing}
            type="button"
            aria-label="Refresh folders"
          >
            <RefreshCw size={14} className={refreshing ? styles.spinSlow : ''} />
          </button>
          <label className={styles.searchBox}>
            <Search className={styles.searchIcon} size={15} />
            <input
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search folders..."
              type="search"
              value={searchInput}
            />
          </label>
          <div className={styles.viewToggle}>
            <button
              className={viewMode === 'tiles' ? styles.viewToggleActive : ''}
              onClick={() => setViewMode('tiles')}
              type="button"
              aria-label="Grid view"
            >
              <Grid3X3 size={15} />
            </button>
            <button
              className={viewMode === 'content' ? styles.viewToggleActive : ''}
              onClick={() => setViewMode('content')}
              type="button"
              aria-label="List view"
            >
              <LayoutList size={15} />
            </button>
          </div>
        </div>
      </section>

      {viewMode === 'tiles' ? (
        <section className={styles.folderGrid}>
          {rootFolders.map((folder, i) => {
            const childCount = folder.children?.length ?? 0;
            const deepFiles = countDeepFiles(folder.children ?? []);
            const colorIdx = i % FOLDER_COLORS.length;
            return (
              <button
                className={styles.folderCard}
                key={folder.id}
                onClick={() => openFolder(folder.id)}
                type="button"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={styles.folderCardTop}>
                  <span className={styles.folderIcon} style={{ background: FOLDER_COLORS[colorIdx] }}>
                    <Folder size={20} style={{ color: FOLDER_ICON_COLORS[colorIdx] }} />
                  </span>
                  <span className={styles.folderItemCount}>{childCount}</span>
                </div>
                <h3>{folder.name}</h3>
                <p>{childCount} item{childCount !== 1 ? 's' : ''}{deepFiles > 0 ? ` · ${deepFiles} file${deepFiles !== 1 ? 's' : ''}` : ''}</p>
                {folder.modifiedTime && (
                  <span className={styles.folderDate}>{formatRelativeDate(folder.modifiedTime)}</span>
                )}
                <span className={styles.folderLink}>Open workspace <ChevronRight size={14} /></span>
              </button>
            );
          })}
          {rootFolders.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <Search size={28} />
              </div>
              <h3>No folders found</h3>
              <p>{searchInput ? 'Try a different search term.' : 'Connect your Google Drive to get started.'}</p>
            </div>
          )}
        </section>
      ) : (
        <section className={styles.folderList}>
          {rootFolders.map((folder) => (
            <button
              className={styles.folderListRow}
              key={folder.id}
              onClick={() => openFolder(folder.id)}
              type="button"
            >
              <span className={styles.folderListIcon}><Folder size={18} /></span>
              <div className={styles.folderListBody}>
                <strong>{folder.name}</strong>
                <span>{folder.children?.length ?? 0} items</span>
              </div>
              <ChevronRight size={16} className={styles.folderListArrow} />
            </button>
          ))}
          {rootFolders.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <Search size={28} />
              </div>
              <h3>No folders found</h3>
              <p>{searchInput ? 'Try a different search term.' : 'Connect your Google Drive to get started.'}</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
