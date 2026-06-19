import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');

const mapping = {
  // Layout
  "Header.jsx": "layout/Header.jsx",
  "Footer.jsx": "layout/Footer.jsx",
  "Sidebar.jsx": "layout/Sidebar.jsx",
  "MobileBottomNav.jsx": "layout/MobileBottomNav.jsx",
  "MobileBottomNav.css": "layout/MobileBottomNav.css",
  "MobileNavProvider.jsx": "layout/MobileNavProvider.jsx",
  "CookieBanner.jsx": "layout/CookieBanner.jsx",
  "AnnouncementBanner.jsx": "layout/AnnouncementBanner.jsx",
  "AnnouncementBar.jsx": "layout/AnnouncementBar.jsx",
  "PWAInstaller.jsx": "layout/PWAInstaller.jsx",

  // Auth
  "LoginForm.jsx": "auth/LoginForm.jsx",
  "SignupForm.jsx": "auth/SignupForm.jsx",
  "ProfileHydrator.jsx": "auth/ProfileHydrator.jsx",
  "OnboardingGuard.jsx": "auth/OnboardingGuard.jsx",

  // UI
  "Modal.jsx": "ui/Modal.jsx",
  "Modal.module.css": "ui/Modal.module.css",
  "TagPill.jsx": "ui/TagPill.jsx",
  "ToastContainer.jsx": "ui/ToastContainer.jsx",
  "Toast.css": "ui/Toast.css",
  "EmptyState.jsx": "ui/EmptyState.jsx",
  "FollowButton.jsx": "ui/FollowButton.jsx",
  "UserAvatar.jsx": "ui/UserAvatar.jsx",

  // Projects
  "ProjectCard.jsx": "projects/ProjectCard.jsx",
  "ProjectCardSkeleton.jsx": "projects/ProjectCardSkeleton.jsx",
  "TrendingProjectCard.jsx": "projects/TrendingProjectCard.jsx",
  "ReactionBar.jsx": "projects/ReactionBar.jsx",
  "SaveToCollectionModal.jsx": "projects/SaveToCollectionModal.jsx",
  "ProjectModalWrapper.jsx": "projects/ProjectModalWrapper.jsx",
  "CommentThread.jsx": "projects/CommentThread.jsx",

  // Profile
  "DesignerCard.jsx": "profile/DesignerCard.jsx",
  "HireMeModal.jsx": "profile/HireMeModal.jsx",
  "ProfileCompletenessCard.jsx": "profile/ProfileCompletenessCard.jsx",
  "CoverEditor.jsx": "profile/CoverEditor.jsx",

  // Design Hub
  "FontCard.jsx": "design-hub/FontCard.jsx",
  "StockPhotoCard.jsx": "design-hub/StockPhotoCard.jsx",
  "StockAssetCard.jsx": "design-hub/StockAssetCard.jsx",

  // Onboarding
  "OnboardingChecklist.jsx": "onboarding/OnboardingChecklist.jsx",
  "OnboardingGuideModal.jsx": "onboarding/OnboardingGuideModal.jsx",
  "OnboardingGuide.css": "onboarding/OnboardingGuide.css",
  "OnboardingModal.jsx": "onboarding/OnboardingModal.jsx",
  "FirstProjectCelebration.jsx": "onboarding/FirstProjectCelebration.jsx",
  "WelcomeModal.jsx": "onboarding/WelcomeModal.jsx",

  // Marketing
  "FeatureShowcase.jsx": "marketing/FeatureShowcase.jsx",
  "HorizontalFeatureScroll.jsx": "marketing/HorizontalFeatureScroll.jsx",
  "HorizontalFeatureScroll.css": "marketing/HorizontalFeatureScroll.css",
  "NewsletterSubscribe.jsx": "marketing/NewsletterSubscribe.jsx",
  "ToolsMarquee.jsx": "marketing/ToolsMarquee.jsx",
  "ToolsMarquee.css": "marketing/ToolsMarquee.css",

  // Misc
  "ImageCropperModal.jsx": "misc/ImageCropperModal.jsx",
  "SubmitContestModal.jsx": "misc/SubmitContestModal.jsx",
  "VirtualGridPage.jsx": "misc/VirtualGridPage.jsx",
  "NotificationsProvider.jsx": "misc/NotificationsProvider.jsx",
  "ImageUpload.jsx": "misc/ImageUpload.jsx",
};

// 1. Get all JS/JSX files in src
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (/\.(js|jsx)$/.test(filePath)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = getAllFiles(SRC_DIR);

// 2. Pre-process all files to convert relative component imports to absolute aliases
// e.g. import Modal from './Modal' -> import Modal from '@/components/Modal'
console.log('Phase 1: Normalizing relative imports in src/components...');
const componentsFiles = allFiles.filter(f => f.startsWith(COMPONENTS_DIR) && !f.includes('node_modules'));
for (const file of componentsFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  for (const compName of Object.keys(mapping)) {
    const baseName = compName.replace(/\.jsx?|\.css$/, '');
    
    // Look for import X from './BaseName'
    const relativeRegex = new RegExp(`from\\s+['"]\\.\\/${baseName}['"]`, 'g');
    if (relativeRegex.test(content)) {
      content = content.replace(relativeRegex, `from '@/components/${baseName}'`);
      changed = true;
    }
    
    // Look for import X from '../BaseName'
    const upRegex = new RegExp(`from\\s+['"]\\.\\.\\/${baseName}['"]`, 'g');
    if (upRegex.test(content)) {
      content = content.replace(upRegex, `from '@/components/${baseName}'`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

// 3. Apply global replacements across ALL files in src/
console.log('Phase 2: Updating absolute aliases to new folder structure...');
for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  for (const [oldName, newPath] of Object.entries(mapping)) {
    const oldBase = oldName.replace(/\.jsx?$/, '');
    const newBase = newPath.replace(/\.jsx?$/, '');
    
    // Replace @/components/Header -> @/components/layout/Header
    const aliasRegex = new RegExp(`@\\/components\\/${oldBase}(?!\\w)`, 'g');
    if (aliasRegex.test(content)) {
      content = content.replace(aliasRegex, `@/components/${newBase}`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

// 4. Create directories and move the actual files
console.log('Phase 3: Moving files...');
for (const [oldName, newPath] of Object.entries(mapping)) {
  const oldFullPath = path.join(COMPONENTS_DIR, oldName);
  const newFullPath = path.join(COMPONENTS_DIR, newPath);

  if (fs.existsSync(oldFullPath)) {
    const dir = path.dirname(newFullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.renameSync(oldFullPath, newFullPath);
    console.log(`Moved ${oldName} -> ${newPath}`);
  }
}

console.log('Component organization complete!');
