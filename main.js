const content = window.PORTFOLIO_CONTENT;
const manifest = window.PORTFOLIO_MANIFEST || {};
const hasManifestItems = (items) => Array.isArray(items) && items.length > 0;
const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));
const portfolioData = {
  profile: manifest.profile || {},
  levelProjects: hasManifestItems(manifest.levelProjects) ? manifest.levelProjects : content.levelProjects,
  modelingWorks: hasManifestItems(manifest.modelingWorks) ? manifest.modelingWorks : content.modelingWorks,
  blueprints: hasManifestItems(manifest.blueprints) ? manifest.blueprints : content.gameProject.blueprints,
  videos: hasManifestItems(manifest.videos) ? manifest.videos : content.videos,
  cursorTrail: manifest.cursorTrail || content.cursorTrail || {},
};
const getProfileValue = (key, fallback = "") => portfolioData.profile?.[key] || fallback;

const profileData = {
  siteTitle: getProfileValue("siteTitle", content.profile.siteTitle),
  nickname: getProfileValue("nickname", content.profile.nickname),
  phone: getProfileValue("phone", content.profile.phone),
  email: getProfileValue("email", content.profile.email),
  avatar: getProfileValue("fallbackAvatar", content.profile.avatar),
  bilibiliVmid: getProfileValue("bilibiliVmid", content.bilibiliModule.vmid),
  bilibiliHomepage: getProfileValue("bilibiliHomepage", content.bilibiliModule.homepage),
  themePreset: getProfileValue("themePreset", "0"),
};

const moduleSwitches = {
  level: getProfileValue("showLevel", "1"),
  modeling: getProfileValue("showModeling", "1"),
  game: getProfileValue("showBlueprint", "1"),
  video: getProfileValue("showVideo", "1"),
  bilibili: getProfileValue("showBilibili", "1"),
  fanqie: getProfileValue("showFanqie", "1"),
  "texture-tool": getProfileValue("showTextureTool", "1"),
  "mini-game": getProfileValue("showMiniGame", "1"),
};
const isModuleEnabled = (value) => String(value ?? "1").trim() !== "0";
const applyModuleSwitches = () => {
  const enabledModuleIds = [];
  let visibleModuleNumber = 0;
  Object.entries(moduleSwitches).forEach(([id, value]) => {
    const enabled = isModuleEnabled(value);
    const section = document.getElementById(id);
    if (section) section.hidden = !enabled;
    document.querySelectorAll(`.nav-links a[href="#${id}"]`).forEach((link) => {
      link.hidden = !enabled;
    });
    if (enabled) {
      enabledModuleIds.push(id);
      visibleModuleNumber += 1;
      const moduleIndex = section?.querySelector(".module-header > span");
      if (moduleIndex) {
        const originalLabel = moduleIndex.dataset.moduleLabel || moduleIndex.textContent.split("/").slice(1).join("/").trim();
        moduleIndex.dataset.moduleLabel = originalLabel;
        moduleIndex.textContent = `${String(visibleModuleNumber).padStart(2, "0")} / ${originalLabel}`;
      }
    }
  });
  const brand = document.querySelector(".brand");
  if (brand) brand.href = enabledModuleIds.length ? `#${enabledModuleIds[0]}` : "#";
};

const themeStorageKey = "portfolio-theme-preset";
const getSavedThemePreset = () => {
  try {
    return window.localStorage.getItem(themeStorageKey);
  } catch {
    return "";
  }
};
const setSavedThemePreset = (theme) => {
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Local storage may be disabled; the live page still switches theme.
  }
};
const normalizeThemePreset = (theme) => (["0", "1", "2", "3"].includes(String(theme).trim()) ? String(theme).trim() : "0");
const getActiveThemePreset = () => document.documentElement.dataset.themePreset || "0";
const applyThemePreset = (nextTheme = getSavedThemePreset() || profileData.themePreset || "0") => {
  const theme = normalizeThemePreset(nextTheme);
  document.documentElement.dataset.themePreset = ["0", "1", "2", "3"].includes(theme) ? theme : "0";
  document.querySelectorAll("[data-theme-option]").forEach((button) => {
    button.dataset.active = String(button.dataset.themeOption === getActiveThemePreset());
  });
};

applyThemePreset();
applyModuleSwitches();

const setupIntroAnimation = () => {
  const root = document.querySelector("[data-intro-slice]");
  if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root?.remove();
    return;
  }

  const size = Math.min(window.innerWidth * 0.74, 680);
  const barCount = 11;
  const barHeight = Math.max(30, Math.min(54, size / 13.5));
  const step = size / barCount;
  const tones = ["soft", "gold", "dark", "soft"];
  root.style.setProperty("--intro-size", `${size}px`);
  root.innerHTML = "";

  for (let index = 0; index < barCount; index += 1) {
    const distanceFromCorner = (index + 0.62) * step;
    const center = distanceFromCorner / 2;
    const length = Math.max(size * 0.24, distanceFromCorner * Math.SQRT2 + barHeight * 3.4);
    const nearCenter = index / (barCount - 1);
    const delay = Math.round((1 - nearCenter) ** 1.65 * 260);
    const exitsLeftDown = index % 2 === 0;
    const exitDistance = Math.round(size * (1.2 + nearCenter * 0.36));
    const bar = document.createElement("span");
    bar.className = "intro-bar";
    bar.dataset.tone = tones[index % tones.length];
    bar.style.setProperty("--bar-left", `${center}px`);
    bar.style.setProperty("--bar-top", `${center}px`);
    bar.style.setProperty("--bar-width", `${length}px`);
    bar.style.setProperty("--bar-height", `${barHeight}px`);
    bar.style.setProperty("--bar-delay", `${delay}ms`);
    bar.style.setProperty("--bar-duration", `${560 + Math.round((1 - nearCenter) * 130)}ms`);
    bar.style.setProperty("--exit-x", `${exitsLeftDown ? -exitDistance : exitDistance}px`);
    bar.style.setProperty("--exit-y", `${exitsLeftDown ? exitDistance : -exitDistance}px`);
    root.append(bar);
  }

  window.setTimeout(() => root.remove(), 1040);
};

setupIntroAnimation();

const setupCursorTrail = () => {
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !window.matchMedia("(hover: hover) and (pointer: fine)").matches
  ) {
    return;
  }

  const config = portfolioData.cursorTrail || {};
  const enabled = String(config.enabled ?? "1").trim() !== "0";
  if (!enabled) return;
  const imageScale = clampValue(Number(config.scale) || 1, 0.2, 4);
  const imageOpacity = clampValue(Number(config.opacity) || 0.86, 0.05, 1);
  const imageSource = String(config.image || "").trim();

  const canvas = document.createElement("canvas");
  canvas.className = "cursor-trail";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const context = canvas.getContext("2d");
  if (!context) return;

  const pointLife = 300;
  const points = [];
  const trailImage = imageSource ? new Image() : null;
  let imageReady = false;
  let imageFailed = false;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;

  const resize = () => {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.max(1, Math.round(width * pixelRatio));
    canvas.height = Math.max(1, Math.round(height * pixelRatio));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  const getTrailColor = () => getComputedStyle(document.documentElement).getPropertyValue("--gold").trim() || "#d8aa68";
  const getPointAlpha = (point, now) => clampValue(1 - (now - point.createdAt) / pointLife, 0, 1) ** 1.35;

  if (trailImage) {
    trailImage.onload = () => {
      imageReady = true;
    };
    trailImage.onerror = () => {
      imageFailed = true;
    };
    trailImage.src = imageSource;
  }

  const drawImageTrail = (now) => {
    if (!trailImage || !imageReady) return false;
    const baseSize = 18 * imageScale;
    for (let index = 0; index < points.length; index += 1) {
      if (index % 4 !== 0 && index !== points.length - 1) continue;
      const point = points[index];
      const alpha = getPointAlpha(point, now);
      if (alpha <= 0) continue;
      const next = points[Math.min(points.length - 1, index + 1)] || point;
      const previous = points[Math.max(0, index - 1)] || point;
      const angle = Math.atan2(next.y - previous.y, next.x - previous.x);
      const size = baseSize * (0.55 + alpha * 0.45);
      context.save();
      context.translate(point.x, point.y);
      context.rotate(angle);
      context.globalAlpha = alpha * imageOpacity;
      context.drawImage(trailImage, -size / 2, -size / 2, size, size);
      context.restore();
    }
    context.globalAlpha = 1;
    return true;
  };

  const drawLineTrail = (now) => {
    const color = getTrailColor();
    context.lineCap = "round";
    context.lineJoin = "round";
    for (let index = 0; index < points.length - 1; index += 1) {
      const p0 = points[Math.max(0, index - 1)];
      const p1 = points[index];
      const p2 = points[index + 1];
      const p3 = points[Math.min(points.length - 1, index + 2)];
      const alpha = Math.min(getPointAlpha(p1, now), getPointAlpha(p2, now));
      context.strokeStyle = color;
      context.globalAlpha = alpha * 0.72;
      context.lineWidth = 0.9 + alpha * 2.7;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      context.beginPath();
      context.moveTo(p1.x, p1.y);
      context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      context.stroke();
    }
    context.globalAlpha = 1;
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    const now = performance.now();
    while (points.length && now - points[0].createdAt > pointLife) {
      points.shift();
    }
    if (points.length > 1) {
      if (!drawImageTrail(now) || imageFailed) drawLineTrail(now);
    }
    window.requestAnimationFrame(draw);
  };

  const addPoint = (event) => {
    if (event.pointerType && event.pointerType !== "mouse") return;
    const now = performance.now();
    const previous = points[points.length - 1];
    if (previous) {
      const distance = Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
      if (distance < 1.2) return;
      const steps = Math.min(24, Math.floor(distance / 4));
      for (let step = 1; step <= steps; step += 1) {
        const ratio = step / (steps + 1);
        points.push({
          x: previous.x + (event.clientX - previous.x) * ratio,
          y: previous.y + (event.clientY - previous.y) * ratio,
          createdAt: now,
        });
      }
    }
    points.push({ x: event.clientX, y: event.clientY, createdAt: now });
  };

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", addPoint, { passive: true });
  window.addEventListener("blur", () => {
    points.length = 0;
  });
  window.requestAnimationFrame(draw);
};

setupCursorTrail();

const tabTitleSuffix = "ciallo～(∠・ω< )⌒☆";
const updateTabTitle = () => {
  document.title = `${profileData.nickname} ${tabTitleSuffix}`;
};
const faviconPath = "assets/external/favicon-circle.png";
const updateFavicon = () => {
  let favicon = document.querySelector('link[rel~="icon"]');
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.append(favicon);
  }
  favicon.type = "image/png";
  favicon.href = faviconPath;
};

updateTabTitle();
updateFavicon();

const headerContact = document.querySelector("[data-header-contact]");

const bindThemePicker = () => {
  headerContact.querySelectorAll("[data-theme-option]").forEach((button) => {
    button.addEventListener("click", () => {
      const theme = normalizeThemePreset(button.dataset.themeOption);
      setSavedThemePreset(theme);
      applyThemePreset(theme);
    });
  });
  applyThemePreset(getActiveThemePreset());
};

const renderHeaderContact = (avatar = profileData.avatar) => {
  const headerItems = [
    profileData.phone ? { label: profileData.phone } : null,
    profileData.email ? { label: profileData.email } : null,
  ].filter(Boolean);

  headerContact.innerHTML = `
    <span class="header-identity">
      <img class="header-avatar" src="${avatar}" alt="" loading="lazy">
      <span class="header-contact-item">${profileData.nickname}</span>
    </span>
    ${headerItems
      .map((item) => {
        const tag = item.href ? "a" : "span";
        const href = item.href ? ` href="${item.href}"` : "";
        return `<${tag} class="header-contact-item"${href}>${item.label}</${tag}>`;
      })
      .join("")}
    <div class="theme-picker" aria-label="配色切换">
      ${["0", "1", "2", "3"]
        .map((theme) => `<button type="button" data-theme-option="${theme}" aria-label="切换配色 ${theme}"></button>`)
        .join("")}
    </div>
  `;
  const avatarImage = headerContact.querySelector(".header-avatar");
  avatarImage.onerror = () => {
    if (avatarImage.getAttribute("src") !== profileData.avatar) {
      avatarImage.src = profileData.avatar;
    }
  };
  bindThemePicker();
};

renderHeaderContact();

const createImageCard = ({ title, image, tag }, isFeatured = false) => {
  const article = document.createElement("article");
  article.className = `image-card${isFeatured ? " is-featured" : ""}`;
  article.innerHTML = `
    <div class="image-frame" role="img" aria-label="${title}">
      <img src="${image}" alt="${title}" loading="lazy">
    </div>
    <div class="image-caption">
      <span>${tag || ""}</span>
      <h2>${title}</h2>
    </div>
  `;
  return article;
};

const createMiniCard = ({ title, image, tag }) => `
  <div class="mini-card" role="img" aria-label="${title}">
    <img src="${image}" alt="${title}" loading="lazy">
    <span>${tag || title}</span>
  </div>
`;

const levelProjects = document.querySelector("[data-level-projects]");

const bindLevelProject = (project) => {
  const cover = project.querySelector(".project-cover");
  const coverImage = project.querySelector(".project-cover img");
  const originalImage = coverImage?.getAttribute("src") || "";
  const openProject = () => {
    project.classList.add("is-open");
  };
  cover?.addEventListener("pointerenter", openProject);
  cover?.addEventListener("mouseenter", openProject);
  cover?.addEventListener("mouseover", openProject);
  project.querySelectorAll(".level-thumb").forEach((thumb) => {
    const image = thumb.dataset.image;
    const swapImage = () => {
      if (coverImage && image) coverImage.src = image;
      project.classList.add("is-open");
    };
    thumb.addEventListener("pointerenter", swapImage);
    thumb.addEventListener("mouseenter", swapImage);
    thumb.addEventListener("mouseover", swapImage);
    thumb.addEventListener("focus", swapImage);
  });
  const closeProject = () => {
    if (coverImage) coverImage.src = originalImage;
    project.classList.remove("is-open");
  };
  project.addEventListener("pointerleave", closeProject);
  project.addEventListener("mouseleave", closeProject);
};

const renderLevelProject = (project, index) => {
  const article = document.createElement("article");
  article.className = `level-project${index === 0 ? " is-featured" : ""}`;
  article.innerHTML = `
    <div class="project-cover" role="img" aria-label="${project.title}">
      <img src="${project.cover}" alt="${project.title}" loading="lazy">
      <div class="project-caption">
        <span>${project.subtitle}</span>
        <h2>${project.title}</h2>
      </div>
    </div>
    <div class="detail-strip" aria-label="${project.title} 细节图">
      ${project.details
        .map(
          (image, detailIndex) => `
            <button class="level-thumb" type="button" data-image="${image}" aria-label="${project.title} detail ${detailIndex + 1}">
              <img src="${image}" alt="${project.title} detail ${detailIndex + 1}" loading="lazy">
            </button>
          `,
        )
        .join("")}
    </div>
  `;
  levelProjects.append(article);
  bindLevelProject(article);
};

const imageExists = (src) =>
  new Promise((resolve) => {
    const image = new Image();
    image.referrerPolicy = "no-referrer";
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });

const padNumber = (value) => String(value).padStart(2, "0");

const loadAutoLevelProjects = async () => {
  const autoProjects = content.levelAutoProjects || [];
  let nextIndex = portfolioData.levelProjects.length;
  for (const config of autoProjects) {
    const cover = `${config.folder}/${config.cover || "cover.jpg"}`;
    if (!(await imageExists(cover))) continue;
    const maxDetails = config.maxDetails || 12;
    const detailPrefix = config.detailPrefix || "detail-";
    const detailExt = config.detailExt || "jpg";
    const detailCandidates =
      config.details ||
      Array.from({ length: maxDetails }, (_, index) => `${detailPrefix}${padNumber(index + 1)}.${detailExt}`);
    const details = [];
    for (const fileName of detailCandidates) {
      const path = `${config.folder}/${fileName}`;
      if (await imageExists(path)) details.push(path);
    }
    renderLevelProject(
      {
        title: config.title || `地编作品 ${padNumber(nextIndex + 1)}`,
        subtitle: config.subtitle || "Auto Level Project",
        cover,
        details,
      },
      nextIndex,
    );
    nextIndex += 1;
  }
};

portfolioData.levelProjects.forEach(renderLevelProject);
if (!hasManifestItems(manifest.levelProjects)) loadAutoLevelProjects();

const modelingGrid = document.querySelector("[data-modeling-grid]");
let activeModelPreview = null;
let threeRuntimePromise = null;

const getThreeRuntime = () => {
  if (!threeRuntimePromise) {
    threeRuntimePromise = Promise.all([
      import("three"),
      import("three/addons/loaders/OBJLoader.js"),
      import("three/addons/loaders/FBXLoader.js"),
      import("three/addons/loaders/MTLLoader.js"),
    ]).then(([THREE, objLoaderModule, fbxLoaderModule, mtlLoaderModule]) => ({
      THREE,
      OBJLoader: objLoaderModule.OBJLoader,
      FBXLoader: fbxLoaderModule.FBXLoader,
      MTLLoader: mtlLoaderModule.MTLLoader,
    }));
  }
  return threeRuntimePromise;
};

const getModelFormat = (modelPath = "") => {
  const cleanPath = String(modelPath).split("?")[0].split("#")[0].toLowerCase();
  if (cleanPath.endsWith(".fbx")) return "fbx";
  return "obj";
};

const getModelFolder = (modelPath = "") => {
  const cleanPath = String(modelPath).split("?")[0].split("#")[0];
  const slash = cleanPath.lastIndexOf("/");
  return slash >= 0 ? cleanPath.slice(0, slash + 1) : "";
};

const getTextureSets = (textures = {}) => {
  const sets = Array.isArray(textures.textureSets) ? textures.textureSets : [];
  if (sets.length) return sets;
  return [
    {
      name: "default",
      baseColor: textures.baseColor || "",
      roughness: textures.roughness || "",
      metalness: textures.metalness || "",
      normal: textures.normal || "",
    },
  ];
};

const hasTextureSource = (textures = {}) =>
  getTextureSets(textures).some((set) => ["baseColor", "roughness", "metalness", "normal"].some((key) => Boolean(set[key])));

const getModelToken = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]/g, "");

const loadModelTextures = async (THREE, textures = {}) => {
  const loader = new THREE.TextureLoader();
  const load = (src, colorSpace = THREE.NoColorSpace) =>
    new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }
      loader.load(
        src,
        (texture) => {
          texture.colorSpace = colorSpace;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          resolve(texture);
        },
        undefined,
        () => resolve(null),
      );
    });

  const [baseColor, roughness, metalness, normal] = await Promise.all([
    load(textures.baseColor, THREE.SRGBColorSpace),
    load(textures.roughness),
    load(textures.metalness),
    load(textures.normal),
  ]);
  return { name: textures.name || "default", token: getModelToken(textures.name || "default"), baseColor, roughness, metalness, normal };
};

const getMaterialToken = (child) => {
  const materials = Array.isArray(child.material) ? child.material : [child.material];
  return getModelToken(
    [
      child.name,
      child.parent?.name,
      ...materials.map((material) => material?.name || ""),
    ].join(" "),
  );
};

const getTextureSetUvNumber = (token = "") => {
  const match = token.match(/uv(\d+)/);
  return match ? match[1] : "";
};

const getMaterialUvHint = (token = "") => {
  const uvMatch = token.match(/uv(\d+)/);
  if (uvMatch) return uvMatch[1];
  const groupMatch = token.match(/initialshadinggroup(\d+)/);
  if (groupMatch) return groupMatch[1];
  if (token.includes("initialshadinggroup")) return "1";
  return "";
};

const getMaterialMap = (items = []) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      material: getModelToken(item.material || ""),
      textureSet: getModelToken(item.textureSet || ""),
    }))
    .filter((item) => item.material && item.textureSet)
    .sort((a, b) => b.material.length - a.material.length);

const findMappedTextureSetIndex = (materialToken, textureSets, materialMap) => {
  const match = materialMap.find((item) => item.material && materialToken.includes(item.material));
  if (!match) return -1;
  const target = match.textureSet;
  const targetUv = getTextureSetUvNumber(target) || (/^\d+$/.test(target) ? target : "");
  return textureSets.findIndex((set) => {
    if (set.token && (set.token.includes(target) || target.includes(set.token))) return true;
    const setUv = getTextureSetUvNumber(set.token);
    return targetUv && setUv === targetUv;
  });
};

const selectTextureSetIndexByToken = (materialToken, textureSets, materialAssignments, usedTextureSets, materialMap = []) => {
  if (!textureSets.length) return -1;
  if (materialAssignments.has(materialToken)) return materialAssignments.get(materialToken);

  const mappedIndex = findMappedTextureSetIndex(materialToken, textureSets, materialMap);
  if (mappedIndex >= 0) {
    materialAssignments.set(materialToken, mappedIndex);
    usedTextureSets.add(mappedIndex);
    return mappedIndex;
  }

  let bestIndex = -1;
  let bestScore = 0;
  const materialUv = getMaterialUvHint(materialToken);
  textureSets.forEach((set, index) => {
    let score = 0;
    if (set.token && materialToken.includes(set.token)) score += 10;
    if (set.token && set.token.includes(materialToken) && materialToken.length > 4) score += 8;
    const setUv = getTextureSetUvNumber(set.token);
    if (materialUv && setUv && materialUv === setUv) score += 20;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  if (bestIndex < 0) {
    bestIndex = textureSets.findIndex((_, index) => !usedTextureSets.has(index));
  }
  if (bestIndex < 0) bestIndex = 0;
  materialAssignments.set(materialToken, bestIndex);
  usedTextureSets.add(bestIndex);
  return bestIndex;
};

const selectTextureSetIndex = (child, textureSets, materialAssignments, usedTextureSets) =>
  selectTextureSetIndexByToken(getMaterialToken(child), textureSets, materialAssignments, usedTextureSets);

const hasMaterialTexture = (material) => {
  if (!material) return false;
  const materials = Array.isArray(material) ? material : [material];
  return materials.some((item) =>
    Boolean(item?.map || item?.normalMap || item?.roughnessMap || item?.metalnessMap || item?.emissiveMap),
  );
};

const tuneMaterialTextures = (THREE, material) => {
  const materials = Array.isArray(material) ? material : [material];
  materials.forEach((item) => {
    if (!item) return;
    if (item.map) item.map.colorSpace = THREE.SRGBColorSpace;
    if (item.emissiveMap) item.emissiveMap.colorSpace = THREE.SRGBColorSpace;
    item.needsUpdate = true;
  });
};

const createModelingSlide = (work, index) => {
  const card = createImageCard(work, true);
  card.dataset.modelIndex = String(index);
  card.dataset.hasModel = String(Boolean(work.model));
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `${work.title}，点击查看模型`);
  return card;
};

modelingGrid.innerHTML = `
  <article class="modeling-carousel" data-modeling-carousel>
    <button class="carousel-arrow is-prev" type="button" aria-label="上一张">‹</button>
    <div class="modeling-viewport">
      <div class="modeling-track" data-modeling-track>
        ${portfolioData.modelingWorks.map((work, index) => createModelingSlide(work, index).outerHTML).join("")}
      </div>
    </div>
    <div class="carousel-dots" data-carousel-dots aria-label="建模作品页码"></div>
    <button class="carousel-arrow is-next" type="button" aria-label="下一张">›</button>
  </article>
  <section class="model-viewer-panel" data-model-viewer hidden aria-live="polite"></section>
`;

const disposeObject3D = (THREE, object) => {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        Object.values(material).forEach((value) => {
          if (value && value.isTexture) value.dispose();
        });
        material.dispose();
      });
    }
  });
};

const destroyModelPreview = () => {
  if (activeModelPreview) {
    activeModelPreview.dispose();
    activeModelPreview = null;
  }
};

const closeModelViewer = () => {
  const panel = document.querySelector("[data-model-viewer]");
  destroyModelPreview();
  document.querySelectorAll("[data-model-index]").forEach((card) => {
    card.dataset.modelSelected = "false";
  });
  if (!panel) return;
  panel.classList.remove("is-open");
  window.setTimeout(() => {
    if (panel.classList.contains("is-open")) return;
    panel.hidden = true;
    panel.innerHTML = "";
  }, 430);
};

const setModelViewerStatus = (panel, text, isError = false, isLoading = false) => {
  const status = panel.querySelector("[data-model-status]");
  if (!status) return;
  status.dataset.error = String(isError);
  status.dataset.loading = String(isLoading);
  if (isLoading) {
    status.innerHTML = `
      <span>模型加载中</span>
      <span class="model-loading-dots" aria-hidden="true">
        <span>。</span><span>。</span><span>。</span>
      </span>
    `;
  } else {
    status.textContent = text;
  }
  status.hidden = false;
};

const setupModelViewer = async (panel, work) => {
  const stage = panel.querySelector("[data-model-stage]");
  const canvas = panel.querySelector("[data-model-canvas]");
  if (!stage || !canvas) return;

  setModelViewerStatus(panel, "模型加载中。。。", false, true);
  const { THREE, OBJLoader, FBXLoader, MTLLoader } = await getThreeRuntime();
  const modelFormat = getModelFormat(work.model);
  const modelLabel = modelFormat.toUpperCase();
  const externalTextures = hasTextureSource(work.textures);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.01, 10000);
  const pivot = new THREE.Vector3(0, 0, 0);
  const defaultMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2f2f2,
    roughness: 0.72,
    metalness: 0.04,
  });
  const hemi = new THREE.HemisphereLight(0xffffff, 0x283040, 2.2);
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(4, 6, 5);
  const fill = new THREE.DirectionalLight(0x9ec9ff, 1.15);
  fill.position.set(-5, 3, -4);
  scene.add(hemi, key, fill);

  let yaw = Math.PI / 4;
  let pitch = Math.PI / 6;
  let distance = 6;
  let minDistance = 0.35;
  let maxDistance = 80;
  let drag = null;
  let loadedObject = null;
  let frame = 0;
  let resizeObserver = null;

  const updateCamera = () => {
    pitch = clampValue(pitch, -Math.PI * 0.46, Math.PI * 0.46);
    distance = clampValue(distance, minDistance, maxDistance);
    const horizontal = Math.cos(pitch) * distance;
    camera.position.set(
      Math.sin(yaw) * horizontal,
      Math.sin(pitch) * distance,
      Math.cos(yaw) * horizontal,
    );
    camera.lookAt(pivot);
  };

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    const offsetY = Math.round(rect.height * 0.3);
    camera.setViewOffset(rect.width, rect.height, 0, -offsetY, rect.width, rect.height);
    camera.updateProjectionMatrix();
  };

  const animate = () => {
    frame = window.requestAnimationFrame(animate);
    renderer.render(scene, camera);
  };

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    stage.setPointerCapture(event.pointerId);
    stage.dataset.dragging = "true";
  };
  const onPointerMove = (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.x = event.clientX;
    drag.y = event.clientY;
    yaw -= dx * 0.007;
    pitch += dy * 0.007;
    updateCamera();
  };
  const onPointerEnd = () => {
    drag = null;
    stage.dataset.dragging = "false";
  };
  const onWheel = (event) => {
    event.preventDefault();
    const zoom = Math.exp(event.deltaY * 0.0011);
    distance *= zoom;
    updateCamera();
  };

  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", onPointerEnd);
  stage.addEventListener("pointercancel", onPointerEnd);
  stage.addEventListener("wheel", onWheel, { passive: false });

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  resize();
  updateCamera();
  animate();

  activeModelPreview = {
    dispose() {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", onPointerEnd);
      stage.removeEventListener("pointercancel", onPointerEnd);
      stage.removeEventListener("wheel", onWheel);
      if (loadedObject) disposeObject3D(THREE, loadedObject);
      defaultMaterial.dispose();
      renderer.dispose();
    },
  };

  setModelViewerStatus(panel, "模型加载中。。。", false, true);
  const sourceTextureSets = externalTextures ? getTextureSets(work.textures) : [];
  const loadedTextureSets = externalTextures
    ? await Promise.all(sourceTextureSets.map((set) => loadModelTextures(THREE, set)))
    : [];
  const materialMap = getMaterialMap(work.materialMap);
  const materialAssignments = new Map();
  const usedTextureSets = new Set();
  const makeTextureMaterial = (textureMaps = {}) =>
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textureMaps.baseColor || null,
      roughnessMap: textureMaps.roughness || null,
      metalnessMap: textureMaps.metalness || null,
      normalMap: textureMaps.normal || null,
      roughness: textureMaps.roughness ? 1 : 0.72,
      metalness: textureMaps.metalness ? 1 : 0.04,
    });

  const loader = modelFormat === "fbx" ? new FBXLoader() : new OBJLoader();
  const modelFolder = getModelFolder(work.model);
  if (typeof loader.setPath === "function") loader.setPath("");
  if (typeof loader.setResourcePath === "function" && modelFolder) loader.setResourcePath(modelFolder);
  if (modelFormat === "obj" && work.material && MTLLoader && typeof loader.setMaterials === "function") {
    setModelViewerStatus(panel, "模型加载中。。。", false, true);
    const mtlLoader = new MTLLoader();
    if (typeof mtlLoader.setPath === "function") mtlLoader.setPath("");
    if (typeof mtlLoader.setResourcePath === "function" && modelFolder) mtlLoader.setResourcePath(modelFolder);
    const materials = await new Promise((resolve) => {
      mtlLoader.load(
        work.material,
        (loadedMaterials) => {
          loadedMaterials.preload();
          resolve(loadedMaterials);
        },
        undefined,
        () => resolve(null),
      );
    });
    if (materials) loader.setMaterials(materials);
    setModelViewerStatus(panel, "模型加载中。。。", false, true);
  }

  loader.load(
    work.model,
    (object) => {
      loadedObject = object;
      object.traverse((child) => {
        if (!child.isMesh) return;
        if (externalTextures) {
          const originalMaterials = Array.isArray(child.material) ? child.material : [child.material];
          const mappedMaterials = originalMaterials.map((material) => {
            const token = getModelToken([child.name, child.parent?.name, material?.name || ""].join(" "));
            const textureIndex = selectTextureSetIndexByToken(
              token,
              loadedTextureSets,
              materialAssignments,
              usedTextureSets,
              materialMap,
            );
            const nextMaterial = makeTextureMaterial(loadedTextureSets[textureIndex] || loadedTextureSets[0]);
            nextMaterial.name = material?.name || "";
            return nextMaterial;
          });
          child.material = Array.isArray(child.material) ? mappedMaterials : mappedMaterials[0];
        } else if (!hasMaterialTexture(child.material)) {
          child.material = defaultMaterial;
        } else {
          tuneMaterialTextures(THREE, child.material);
        }
        if (child.geometry && !child.geometry.attributes.normal) child.geometry.computeVertexNormals();
        child.castShadow = true;
        child.receiveShadow = true;
      });
      scene.add(object);

      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const radius = Math.max(size.length() * 0.5, 1);
      distance = radius * 2.4;
      minDistance = Math.max(radius * 0.08, 0.02);
      maxDistance = Math.max(radius * 8, 8);
      camera.near = Math.max(radius / 1000, 0.01);
      camera.far = Math.max(radius * 30, 100);
      camera.updateProjectionMatrix();

      const gridSize = Math.max(radius * 2.5, 4);
      const grid = new THREE.GridHelper(gridSize, 12, 0x9a9a9a, 0x454545);
      const axes = new THREE.AxesHelper(Math.max(radius * 0.4, 1));
      scene.add(grid, axes);
      updateCamera();

      const status = panel.querySelector("[data-model-status]");
      if (status) status.hidden = true;
    },
    (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      setModelViewerStatus(panel, "模型加载中。。。", false, true);
    },
    () => {
      const protocolHint =
        window.location.protocol === "file:"
          ? `当前是双击文件打开，浏览器会拦截 ${modelLabel} 读取。请运行“启动本地预览.ps1”，再用 http://localhost:8088/ 打开。`
          : `请确认 ${modelLabel} 文件已上传，并且路径、贴图文件没有改名或丢失。`;
      setModelViewerStatus(panel, `模型加载失败。${protocolHint}`, true);
    },
  );
};

const openModelViewer = async (index) => {
  const panel = document.querySelector("[data-model-viewer]");
  const work = portfolioData.modelingWorks[index];
  if (!panel || !work) return;
  if (!work.model) {
    closeModelViewer();
    return;
  }
  destroyModelPreview();
  panel.classList.remove("is-open");
  panel.hidden = false;
  panel.innerHTML = `
    <div class="model-viewer-heading">
      <div>
        <span>Model Preview</span>
        <h2>${work.title}</h2>
      </div>
      <p>左键旋转视角 / 滚轮缩放</p>
    </div>
    <div class="model-viewer-stage" data-model-stage>
      <canvas data-model-canvas></canvas>
      <div class="model-viewer-status" data-model-status></div>
    </div>
  `;
  panel.offsetHeight;
  window.requestAnimationFrame(() => {
    panel.classList.add("is-open");
  });
  document.querySelectorAll("[data-model-index]").forEach((card) => {
    card.dataset.modelSelected = String(Number(card.dataset.modelIndex) === index);
  });
  try {
    await setupModelViewer(panel, work);
  } catch (error) {
    setModelViewerStatus(panel, "3D 查看器初始化失败，请检查网络环境或 Three.js CDN 是否可访问。", true);
  }
};

const setupModelingCarousel = () => {
  const carousel = document.querySelector("[data-modeling-carousel]");
  const track = document.querySelector("[data-modeling-track]");
  const dotsRoot = document.querySelector("[data-carousel-dots]");
  if (!carousel || !track) return;
  let index = 0;
  let isAnimating = false;
  let autoTimer = null;
  const realSlides = [...track.children];
  const clone = realSlides[0]?.cloneNode(true);
  if (clone) {
    clone.dataset.clone = "true";
    track.append(clone);
  }
  const slides = [...track.children];
  const viewport = carousel.querySelector(".modeling-viewport");
  const dots = realSlides.map((slide, slideIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `切换到第 ${slideIndex + 1} 张`);
    button.addEventListener("click", () => {
      if (isAnimating || index === slideIndex) return;
      restartAuto();
      isAnimating = true;
      index = slideIndex;
      render();
    });
    dotsRoot?.append(button);
    return button;
  });
  track.addEventListener("transitionend", () => {
    if (index === realSlides.length) {
      track.style.transition = "none";
      index = 0;
      render();
      track.offsetHeight;
      track.style.transition = "";
    }
    isAnimating = false;
  });
  const syncCarouselHeight = () => {
    if (!viewport) return;
    const activeIndex = index === realSlides.length ? 0 : index;
    const activeSlide = slides[activeIndex];
    if (!activeSlide) return;
    const height = Math.ceil(activeSlide.getBoundingClientRect().height);
    if (height > 0) viewport.style.height = `${height}px`;
  };
  track.querySelectorAll("img").forEach((image) => {
    if (image.complete) return;
    image.addEventListener("load", syncCarouselHeight, { once: true });
  });
  window.addEventListener("resize", syncCarouselHeight);
  const render = () => {
    track.style.transform = `translateX(${-index * 100}%)`;
    slides.forEach((slide, slideIndex) => {
      slide.dataset.active = String(slideIndex === index || (index === realSlides.length && slideIndex === 0));
    });
    dots.forEach((dot, dotIndex) => {
      dot.dataset.active = String((index === realSlides.length ? 0 : index) === dotIndex);
    });
    requestAnimationFrame(syncCarouselHeight);
  };
  const move = (direction, isManual = false) => {
    if (isAnimating || realSlides.length <= 1) return;
    if (isManual) restartAuto();
    isAnimating = true;
    if (direction > 0) {
      index = Math.min(index + 1, realSlides.length);
    } else {
      index = index <= 0 ? realSlides.length - 1 : index - 1;
    }
    render();
  };
  track.addEventListener("click", (event) => {
    const slide = event.target.closest("[data-model-index]");
    if (!slide) return;
    openModelViewer(Number(slide.dataset.modelIndex));
  });
  track.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const slide = event.target.closest("[data-model-index]");
    if (!slide) return;
    event.preventDefault();
    openModelViewer(Number(slide.dataset.modelIndex));
  });
  const restartAuto = () => {
    window.clearInterval(autoTimer);
    autoTimer = window.setInterval(() => move(1), 5200);
  };
  carousel.querySelector(".is-prev")?.addEventListener("click", () => move(-1, true));
  carousel.querySelector(".is-next")?.addEventListener("click", () => move(1, true));
  restartAuto();
  render();
};

setupModelingCarousel();

const gameModule = document.querySelector("[data-game-module]");
const game = content.gameProject;
const blueprints = portfolioData.blueprints;
const getFileStem = (filePath = "") => {
  const fileName = decodeURIComponent(filePath.split(/[\\/]/).pop() || "");
  return fileName.replace(/\.[^.]+$/, "");
};
const cleanOrderedName = (name = "") => name.replace(/^\d+[-_. ]*/, "");
const getBlueprintDisplayName = (blueprint, index = 0) =>
  cleanOrderedName(getFileStem(blueprint?.txtFile)) || blueprint?.title || `蓝图${index + 1}`;

gameModule.innerHTML = `
  <div class="blueprint-viewer">
    <div class="blueprint-toolbar">
      <div>
        <strong data-blueprint-active-title>${getBlueprintDisplayName(blueprints[0], 0)}</strong>
      </div>
      <button type="button" data-blueprint-reset>重置视图</button>
    </div>
    <div class="blueprint-stage" data-blueprint-stage>
      <div class="blueprint-canvas" data-blueprint-canvas></div>
    </div>
  </div>
  <div class="game-side">
    <div class="blueprint-switcher" data-blueprint-switcher>
      ${blueprints
        .map(
          (blueprint, index) => `
            <button type="button" data-blueprint-index="${index}">
              <strong>${getBlueprintDisplayName(blueprint, index)}</strong>
            </button>
          `,
        )
        .join("")}
    </div>
  </div>
`;

const syncBlueprintSwitcherHeight = () => {
  const viewer = document.querySelector(".blueprint-viewer");
  const switcher = document.querySelector("[data-blueprint-switcher]");
  if (!viewer || !switcher) return;
  const height = Math.round(viewer.getBoundingClientRect().height);
  if (height > 0) switcher.style.maxHeight = `${height}px`;
};

if ("ResizeObserver" in window) {
  const blueprintSizeObserver = new ResizeObserver(syncBlueprintSwitcherHeight);
  blueprintSizeObserver.observe(document.querySelector(".blueprint-viewer"));
}
window.addEventListener("resize", syncBlueprintSwitcherHeight);
requestAnimationFrame(syncBlueprintSwitcherHeight);

const parseBlueprintText = (text) => {
  const lines = text.split(/\r?\n/);
  const blocks = [];
  let current = null;
  let depth = 0;

  lines.forEach((line) => {
    const match =
      !current && line.match(/^Begin Object Class=\/Script\/[^.]+\.([^\s]+) Name="([^"]+)"/);
    if (match) {
      current = { className: match[1], name: match[2], lines: [line] };
      depth = 1;
      return;
    }
    if (!current) return;
    current.lines.push(line);
    if (/^\s*Begin Object /.test(line)) depth += 1;
    if (/^\s*End Object\s*$/.test(line)) {
      depth -= 1;
      if (depth <= 0) {
        blocks.push(current);
        current = null;
        depth = 0;
      }
    }
  });

  const nodes = [];
  const links = new Map();
  const pendingLinks = [];
  const pinMap = new Map();

  blocks.forEach((block) => {
    const body = block.lines.join("\n");
    const name = block.name;
    const xMatch = body.match(/NodePosX=(-?\d+)/) || body.match(/MaterialExpressionEditorX=(-?\d+)/);
    const yMatch = body.match(/NodePosY=(-?\d+)/) || body.match(/MaterialExpressionEditorY=(-?\d+)/);
    const x = xMatch ? Number(xMatch[1]) : 0;
    const y = yMatch ? Number(yMatch[1]) : 0;
    let expr = (body.match(/MaterialExpression="\/Script\/Engine\.([^'"]+)/) || [])[1];
    if (!expr) expr = (body.match(/Begin Object Class=\/Script\/Engine\.([^\s]+)/) || [])[1];
    if (!expr) expr = block.className || (name.includes("Root") ? "Material Output" : "Graph Node");
    const param = (body.match(/ParameterName="([^"]+)"/) || [])[1];
    const reroute = (body.match(/\n\s*Name="([^"]+)"/) || [])[1];
    const comment = (body.match(/NodeComment="([^"]+)"/) || [])[1];
    const eventName = (body.match(/EventReference=\([^)]*MemberName="([^"]+)"/) || [])[1];
    const functionName = (body.match(/FunctionReference=\([^)]*MemberName="([^"]+)"/) || [])[1];
    const variableName = (body.match(/VariableReference=\([^)]*MemberName="([^"]+)"/) || [])[1];
    const cleanClass = expr
      .replace(/^MaterialExpression/, "")
      .replace(/^K2Node_/, "")
      .replace(/^EdGraphNode_/, "");
    const title =
      name === "MaterialGraphNode_Root_0"
        ? "Material Output"
        : comment ||
          param ||
          eventName ||
          functionName ||
          (variableName && expr.includes("VariableSet") ? `Set ${variableName}` : "") ||
          (variableName && expr.includes("VariableGet") ? `Get ${variableName}` : "") ||
          (expr.includes("NamedReroute") && reroute ? reroute : cleanClass);
    const group = (body.match(/Group="([^"]+)"/) || [])[1] || "";
    const inputs = [];
    const outputs = [];

    block.lines.forEach((line) => {
      if (!line.includes("CustomProperties Pin")) return;
      const pinId = (line.match(/PinId=([A-F0-9]+)/) || [])[1];
      const pinName = (line.match(/PinName="([^"]+)"/) || [])[1];
      const isOutput = line.includes('Direction="EGPD_Output"');
      if (pinName) {
        if (isOutput) outputs.push(pinName);
        else inputs.push(pinName);
      }
      if (pinId && pinName) {
        pinMap.set(pinId, { node: name, name: pinName, isOutput });
      }
      if (!line.includes("LinkedTo=")) return;
      [...line.matchAll(/([A-Za-z0-9_]+Node_[A-Za-z0-9_]+|K2Node_[A-Za-z0-9_]+|MaterialGraphNode(?:_Root)?_\d+)\s+([A-F0-9]+)/g)].forEach((targetMatch) => {
        const target = targetMatch[1];
        const targetPinId = targetMatch[2];
        if (!target || target === name) return;
        pendingLinks.push({
          from: isOutput ? name : target,
          to: isOutput ? target : name,
          fromPin: isOutput ? pinName : "",
          toPin: isOutput ? "" : pinName,
          fromPinId: isOutput ? pinId : targetPinId,
          toPinId: isOutput ? targetPinId : pinId,
        });
      });
    });

    nodes.push({
      id: name,
      title,
      type: expr.replace(/^MaterialExpression/, ""),
      group,
      x,
      y,
      inputs,
      outputs,
    });
  });

  if (!nodes.length) {
    return {
      meta: { title: "UE Blueprint Text Graph", source: "txt", nodeCount: 1, linkCount: 0 },
      nodes: [
        {
          id: "empty",
          title: "未识别到可展示节点",
          type: "Graph Node",
          group: "",
          x: 80,
          y: 80,
          inputs: [],
          outputs: ["Output"],
        },
      ],
      links: [],
    };
  }

  pendingLinks.forEach((link) => {
    const fromPin = pinMap.get(link.fromPinId);
    const toPin = pinMap.get(link.toPinId);
    const resolved = {
      from: link.from,
      to: link.to,
      fromPin: link.fromPin || fromPin?.name || "",
      toPin: link.toPin || toPin?.name || "",
    };
    links.set(`${resolved.from}:${resolved.fromPin}->${resolved.to}:${resolved.toPin}`, resolved);
  });

  const minX = Math.min(...nodes.map((node) => node.x));
  const minY = Math.min(...nodes.map((node) => node.y));
  const scaled = nodes.map((node) => ({
    ...node,
    x: Math.round((node.x - minX) * 0.42 + 80),
    y: Math.round((node.y - minY) * 0.62 + 80),
  }));

  return {
    meta: { title: "UE Blueprint Text Graph", source: "txt", nodeCount: scaled.length, linkCount: links.size },
    nodes: scaled,
    links: [...links.values()],
  };
};

const loadBlueprintGraph = async (blueprint) => {
  if (blueprint.text) {
    return parseBlueprintText(blueprint.text);
  }
  if (blueprint.txtFile) {
    try {
      const response = await fetch(blueprint.txtFile);
      if (response.ok) return parseBlueprintText(await response.text());
    } catch {
      // Direct file opening may block fetch; fall back to the prebuilt data object.
    }
  }
  return window[blueprint.graphKey] || window.BLUEPRINT_GRAPH;
};

const renderBlueprintGraph = (graph, activeBlueprint) => {
  const canvas = document.querySelector("[data-blueprint-canvas]");
  const stage = document.querySelector("[data-blueprint-stage]");
  if (!graph || !canvas || !stage) return;

  const nodeMinWidth = 86;
  const nodeBaseHeight = 29;
  const pinRowHeight = 12.8;
  const pinCenterYOffset = 41;
  const inputPinCenterX = 9;
  const outputPinCenterX = 9;
  const minScale = 0.08;
  const maxScale = 2.4;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const textUnits = (text) =>
    [...String(text || "")].reduce((total, char) => total + (/[\u4e00-\u9fff]/.test(char) ? 1.05 : 0.58), 0);
  const estimateNodeWidth = (node) => {
    const pinLabels = [...node.displayInputs, ...node.displayOutputs];
    const longestPin = Math.max(0, ...pinLabels.map((pin) => textUnits(pin) * 6.8 + 28));
    return clamp(
      Math.ceil(
        Math.max(
          nodeMinWidth,
          textUnits(node.title) * 10.8 + 38,
          textUnits(node.group || node.type) * 6.2 + 22,
          longestPin,
        ),
      ),
      nodeMinWidth,
      340,
    );
  };
  const linkedPins = new Map();
  graph.nodes.forEach((node) => linkedPins.set(node.id, { inputs: new Set(), outputs: new Set() }));
  graph.links.forEach((link) => {
    if (link.fromPin) linkedPins.get(link.from)?.outputs.add(link.fromPin);
    if (link.toPin) linkedPins.get(link.to)?.inputs.add(link.toPin);
  });
  const pickPins = (pins, usedPins, limit) => {
    const picked = [...pins.filter((pin) => usedPins.has(pin)), ...pins.filter((pin) => !usedPins.has(pin))];
    return [...new Set(picked)].slice(0, limit);
  };
  graph.nodes.forEach((node) => {
    if (node._baseX === undefined) node._baseX = node.x;
    if (node._baseY === undefined) node._baseY = node.y;
    node.x = node._baseX;
    node.y = node._baseY;
    const pins = linkedPins.get(node.id);
    node.displayInputs = pickPins(node.inputs, pins.inputs, 3);
    node.displayOutputs = pickPins(node.outputs, pins.outputs, 3);
    node.width = estimateNodeWidth(node);
    node.height = nodeBaseHeight + 28 + (node.displayInputs.length + node.displayOutputs.length) * pinRowHeight;
  });
  const layoutGap = 34;
  const verticalLayoutGap = 24;
  const layoutNodes = [...graph.nodes].sort((a, b) => a.x - b.x || a.y - b.y);
  for (let pass = 0; pass < 20; pass += 1) {
    let moved = false;
    layoutNodes.sort((a, b) => a.x - b.x || a.y - b.y);
    for (let i = 0; i < layoutNodes.length; i += 1) {
      const node = layoutNodes[i];
      for (let j = 0; j < i; j += 1) {
        const other = layoutNodes[j];
        const yOverlap = Math.min(node.y + node.height, other.y + other.height) - Math.max(node.y, other.y);
        const xOverlap = Math.min(node.x + node.width, other.x + other.width) - Math.max(node.x, other.x);
        if (xOverlap > -layoutGap * 0.35 && yOverlap > -verticalLayoutGap) {
          node.x = other.x + other.width + layoutGap;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
  const minX = Math.min(...graph.nodes.map((node) => node.x));
  const minY = Math.min(...graph.nodes.map((node) => node.y));
  const maxNodeX = Math.max(...graph.nodes.map((node) => node.x + node.width));
  const maxNodeY = Math.max(...graph.nodes.map((node) => node.y + node.height));
  const maxX = maxNodeX + 120;
  const maxY = maxNodeY + 120;
  const getNodeKind = (node) => {
    const type = `${node.type} ${node.title}`.toLowerCase();
    if (type.includes("comment")) return "comment";
    if (type.includes("enhancedinput") || type.includes("inputaction")) return "input";
    if (type.includes("event") || type.includes("customevent")) return "event";
    if (type.includes("variableget")) return "variable-get";
    if (type.includes("variableset")) return "variable-set";
    if (type.includes("ifthenelse") || type.includes("branch")) return "branch";
    if (type.includes("switch")) return "switch";
    if (type.includes("dynamiccast") || type.includes("cast")) return "cast";
    if (type.includes("delay") || type.includes("timeline")) return "flow";
    if (type.includes("callfunction") || type.includes("function")) return "function";
    if (type.includes("output") || type.includes("root")) return "output";
    if (type.includes("texture")) return "texture";
    if (type.includes("parameter")) return "parameter";
    if (type.includes("reroute")) return "reroute";
    if (
      type.includes("multiply") ||
      type.includes("divide") ||
      type.includes("add") ||
      type.includes("power") ||
      type.includes("saturate") ||
      type.includes("linearinterpolate") ||
      type.includes("distance")
    ) {
      return "math";
    }
    if (type.includes("materialattributes") || type.includes("layer")) return "material";
    return "default";
  };

  const paths = graph.links
    .map((link) => {
      const from = nodeMap.get(link.from);
      const to = nodeMap.get(link.to);
      if (!from || !to) return "";
      const outputIndex = Math.max(0, from.displayOutputs.indexOf(link.fromPin));
      const inputIndex = Math.max(0, to.displayInputs.indexOf(link.toPin));
      const startX = from.x + from.width - outputPinCenterX;
      const startY = from.y + pinCenterYOffset + (from.displayInputs.length + outputIndex) * pinRowHeight;
      const endX = to.x + inputPinCenterX;
      const endY = to.y + pinCenterYOffset + inputIndex * pinRowHeight;
      const curve = Math.max(18, Math.abs(endX - startX) * 0.42);
      const controlA = startX + curve;
      const controlB = endX - curve;
      return `<path d="M ${startX} ${startY} C ${controlA} ${startY}, ${controlB} ${endY}, ${endX} ${endY}" />`;
    })
    .join("");

  const nodes = graph.nodes
    .map((node) => {
      const pins = [
        ...node.displayInputs.map((pin) => `<li><i></i>${pin}</li>`),
        ...node.displayOutputs.map((pin) => `<li class="is-output">${pin}<i></i></li>`),
      ].join("");
      const group = node.group ? `<small>${node.group}</small>` : `<small>${node.type}</small>`;
      const kind = getNodeKind(node);
      return `
        <article class="blueprint-node is-${kind}" style="left:${node.x}px; top:${node.y}px; width:${node.width}px;">
          <header>
            <strong>${node.title}</strong>
            ${group}
          </header>
          <ul>${pins || "<li><i></i>Output</li>"}</ul>
        </article>
      `;
    })
    .join("");

  canvas.style.width = `${maxX}px`;
  canvas.style.height = `${maxY}px`;
  canvas.dataset.graphTitle = getBlueprintDisplayName(activeBlueprint) || graph.meta?.title || "";
  canvas.innerHTML = `
    <svg class="blueprint-wires" width="${maxX}" height="${maxY}" viewBox="0 0 ${maxX} ${maxY}" aria-hidden="true">
      ${paths}
    </svg>
    ${nodes}
  `;

  const getCenteredState = (scale = 0.3) => ({
    x: Math.round((stage.clientWidth - (maxNodeX - minX) * scale) / 2 - minX * scale),
    y: Math.round((stage.clientHeight - (maxNodeY - minY) * scale) / 2 - minY * scale),
    scale,
    drag: null,
  });
  const state = getCenteredState();
  stage._blueprintState = state;
  stage._blueprintCenter = getCenteredState;

  const applyTransform = (nextState = stage._blueprintState) => {
    canvas.style.transform = `translate(${nextState.x}px, ${nextState.y}px) scale(${nextState.scale})`;
    stage.style.setProperty("--blueprint-scale", nextState.scale.toFixed(2));
  };
  stage._blueprintApply = applyTransform;

  if (!stage.dataset.bound) {
    stage.dataset.bound = "true";
    stage.addEventListener("pointerdown", (event) => {
      const viewerState = stage._blueprintState;
      viewerState.drag = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: viewerState.x,
        originY: viewerState.y,
      };
      stage.setPointerCapture(event.pointerId);
      stage.dataset.dragging = "true";
    });

    stage.addEventListener("pointermove", (event) => {
      const viewerState = stage._blueprintState;
      const drag = viewerState.drag;
      if (!drag || drag.id !== event.pointerId) return;
      const panScale = Math.sqrt(Math.max(viewerState.scale, minScale));
      viewerState.x = drag.originX + (event.clientX - drag.startX) / panScale;
      viewerState.y = drag.originY + (event.clientY - drag.startY) / panScale;
      applyTransform(viewerState);
    });

    const endDrag = () => {
      const viewerState = stage._blueprintState;
      if (viewerState) viewerState.drag = null;
      stage.dataset.dragging = "false";
    };

    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        const viewerState = stage._blueprintState;
        const rect = stage.getBoundingClientRect();
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;
        const beforeX = (pointerX - viewerState.x) / viewerState.scale;
        const beforeY = (pointerY - viewerState.y) / viewerState.scale;
        const zoomFactor = event.deltaY < 0 ? 1.12 : 0.89;
        const nextScale = clamp(viewerState.scale * zoomFactor, minScale, maxScale);
        viewerState.x = pointerX - beforeX * nextScale;
        viewerState.y = pointerY - beforeY * nextScale;
        viewerState.scale = nextScale;
        applyTransform(viewerState);
      },
      { passive: false },
    );
  }

  const resetButton = document.querySelector("[data-blueprint-reset]");
  if (resetButton && !resetButton.dataset.bound) {
    resetButton.dataset.bound = "true";
    resetButton.addEventListener("click", () => {
      stage._blueprintState = stage._blueprintCenter?.(0.3) || { x: 0, y: 0, scale: 0.3, drag: null };
      stage._blueprintApply?.(stage._blueprintState);
    });
  }

  applyTransform(state);
};

const setupBlueprintSwitcher = async () => {
  const switcher = document.querySelector("[data-blueprint-switcher]");
  if (!switcher) return;
  const buttons = [...switcher.querySelectorAll("button")];
  const activate = async (index) => {
    const blueprint = blueprints[index];
    const activeTitle = document.querySelector("[data-blueprint-active-title]");
    if (activeTitle) activeTitle.textContent = getBlueprintDisplayName(blueprint, index);
    buttons.forEach((button, buttonIndex) => {
      button.dataset.active = String(buttonIndex === index);
    });
    const graph = await loadBlueprintGraph(blueprint);
    renderBlueprintGraph(graph, blueprint);
  };
  buttons.forEach((button) => {
    button.addEventListener("click", () => activate(Number(button.dataset.blueprintIndex)));
  });
  await activate(0);
};

setupBlueprintSwitcher();

const videoModule = document.querySelector("[data-video-module]");
let activeVideoIndex = 0;
let activeGradientFrame = 0;

const drawGradientFrame = (canvas, progress = 0) => {
  const context = canvas.getContext("2d");
  if (!context) return;
  const { width, height } = canvas;
  const gradient = context.createLinearGradient(0, 0, width, height);
  for (let stop = 0; stop <= 6; stop += 1) {
    const hue = (progress * 360 + stop * 58) % 360;
    gradient.addColorStop(stop / 6, `hsl(${hue} 92% 58%)`);
  }
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(0, 0, 0, 0.18)";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(255, 255, 255, 0.82)";
  context.font = "700 44px Inter, sans-serif";
  context.letterSpacing = "2px";
  context.fillText("RAINBOW DEMO", 72, height - 82);
};

const bindGradientVideo = (root, item) => {
  const viewport = root.querySelector("[data-video-viewport]");
  const chrome = root.querySelector(".video-chrome");
  const canvas = root.querySelector("[data-video-canvas]");
  const playState = root.querySelector("[data-video-state]");
  const playButton = root.querySelector("[data-video-toggle]");
  const progress = root.querySelector("[data-video-progress]");
  if (!viewport || !canvas) return;
  const duration = Math.max(1, Number(item.duration) || 5);
  const durationMs = duration * 1000;
  let playing = false;
  let elapsedMs = 0;
  let startedAt = 0;

  const updateControls = () => {
    if (progress) progress.value = (elapsedMs / durationMs).toFixed(3);
    if (playButton) playButton.textContent = playing ? "暂停" : elapsedMs >= durationMs ? "重播" : "播放";
    if (playState) playState.textContent = playing ? "播放中" : elapsedMs >= durationMs ? "播放结束" : "已暂停";
  };
  const pause = (keepElapsed = false) => {
    if (playing && !keepElapsed) elapsedMs = Math.min(durationMs, performance.now() - startedAt);
    playing = false;
    window.cancelAnimationFrame(activeGradientFrame);
    updateControls();
  };
  const tick = (time) => {
    if (!playing) return;
    elapsedMs = Math.min(durationMs, time - startedAt);
    const ratio = elapsedMs / durationMs;
    drawGradientFrame(canvas, ratio);
    updateControls();
    if (ratio >= 1) {
      pause();
      return;
    }
    activeGradientFrame = window.requestAnimationFrame(tick);
  };
  const play = () => {
    if (elapsedMs >= durationMs) elapsedMs = 0;
    startedAt = performance.now() - elapsedMs;
    playing = true;
    updateControls();
    activeGradientFrame = window.requestAnimationFrame(tick);
  };
  const toggle = () => {
    if (playing) pause();
    else play();
  };

  drawGradientFrame(canvas, 0);
  updateControls();
  chrome?.addEventListener("click", (event) => event.stopPropagation());
  chrome?.addEventListener("pointerdown", (event) => event.stopPropagation());
  chrome?.addEventListener("pointerup", (event) => event.stopPropagation());
  viewport.addEventListener("click", toggle);
  playButton?.addEventListener("click", toggle);
  progress?.addEventListener("input", () => {
    elapsedMs = Number(progress.value) * durationMs;
    drawGradientFrame(canvas, Number(progress.value));
    pause(true);
  });
};

const bindVideoPlayer = (root, item) => {
  const viewport = root.querySelector("[data-video-viewport]");
  const chrome = root.querySelector(".video-chrome");
  const video = root.querySelector("[data-video-element]");
  const volume = root.querySelector("[data-video-volume]");
  const playState = root.querySelector("[data-video-state]");
  const playButton = root.querySelector("[data-video-toggle]");
  const progress = root.querySelector("[data-video-progress]");
  if (!viewport || !video) return;
  video.volume = Number(volume?.value || 0);
  let isSeeking = false;
  const updateProgress = () => {
    if (!progress || !Number.isFinite(video.duration) || video.duration <= 0) return;
    if (isSeeking) return;
    progress.value = (video.currentTime / video.duration).toFixed(3);
  };
  const seekToProgress = () => {
    if (!progress || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const ratio = Math.max(0, Math.min(1, Number(progress.value) || 0));
    isSeeking = true;
    video.currentTime = ratio * video.duration;
    progress.value = ratio.toFixed(3);
    video.pause();
    if (playState) playState.textContent = "已暂停";
    if (playButton) playButton.textContent = "播放";
    window.requestAnimationFrame(() => {
      isSeeking = false;
      updateProgress();
    });
  };
  const toggle = async () => {
    if (video.paused) {
      if (video.ended) video.currentTime = 0;
      await video.play();
    } else {
      video.pause();
    }
  };
  chrome?.addEventListener("click", (event) => event.stopPropagation());
  chrome?.addEventListener("pointerdown", (event) => event.stopPropagation());
  chrome?.addEventListener("pointerup", (event) => event.stopPropagation());
  viewport.addEventListener("click", toggle);
  playButton?.addEventListener("click", toggle);
  video.addEventListener("play", () => {
    if (playState) playState.textContent = "播放中";
    if (playButton) playButton.textContent = "暂停";
  });
  video.addEventListener("pause", () => {
    if (playState) playState.textContent = video.ended ? "播放结束" : "已暂停";
    if (playButton) playButton.textContent = video.ended ? "重播" : "播放";
  });
  video.addEventListener("ended", () => {
    if (playState) playState.textContent = "播放结束";
    if (playButton) playButton.textContent = "重播";
    updateProgress();
  });
  video.addEventListener("loadedmetadata", updateProgress);
  video.addEventListener("timeupdate", updateProgress);
  video.addEventListener("seeked", updateProgress);
  progress?.addEventListener("pointerdown", () => {
    isSeeking = true;
  });
  progress?.addEventListener("input", seekToProgress);
  progress?.addEventListener("pointerup", () => {
    isSeeking = false;
    updateProgress();
  });
  progress?.addEventListener("change", () => {
    seekToProgress();
  });
  volume?.addEventListener("input", () => {
    video.volume = Number(volume.value);
  });
  if (playButton) playButton.textContent = "播放";
};

const renderVideoModule = () => {
  if (!videoModule) return;
  const videos = hasManifestItems(portfolioData.videos) ? portfolioData.videos : content.videos;
  if (!hasManifestItems(videos)) return;
  const item = videos[Math.min(activeVideoIndex, videos.length - 1)];
  window.cancelAnimationFrame(activeGradientFrame);
  videoModule.innerHTML = `
    <article class="video-card">
      <div class="video-viewport" data-video-viewport role="button" tabindex="0" aria-label="${item.title}">
        ${
          item.type === "gradient"
            ? `<canvas class="video-media" data-video-canvas width="1280" height="720"></canvas>`
            : `<video class="video-media" data-video-element src="${item.source}" ${item.poster ? `poster="${item.poster}"` : ""} preload="metadata" playsinline></video>`
        }
        <div class="video-chrome">
          <button class="video-toggle" type="button" data-video-toggle>播放</button>
          <input class="video-progress" data-video-progress type="range" min="0" max="1" step="0.001" value="0" aria-label="播放进度">
          <label class="video-volume">
            <span>音量</span>
            <input data-video-volume type="range" min="0" max="1" step="0.01" value="0">
          </label>
        </div>
      </div>
      <div class="video-meta">
        <span>${item.tag || "Video"}</span>
        <h2>${item.title}</h2>
        ${item.text ? `<p>${item.text}</p>` : ""}
      </div>
    </article>
    <div class="video-switcher" aria-label="视频切换">
      ${videos
        .map(
          (video, index) => `
            <button type="button" data-video-index="${index}" data-active="${index === activeVideoIndex}">
              ${video.title}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
  videoModule.querySelectorAll("[data-video-index]").forEach((button) => {
    button.addEventListener("click", () => {
      activeVideoIndex = Number(button.dataset.videoIndex);
      renderVideoModule();
    });
  });
  if (item.type === "gradient") bindGradientVideo(videoModule, item);
  else bindVideoPlayer(videoModule, item);
};

renderVideoModule();

const renderExternalModule = (selector, data, options = {}) => {
  const root = document.querySelector(selector);
  root._externalOptions = options;
  root._externalData = data;
  root.innerHTML = `
    <div class="external-image" role="img" aria-label="${data.title}">
      <img src="${data.image}" alt="${data.title}" loading="lazy" referrerpolicy="no-referrer">
    </div>
    <div class="external-body">
      <span>${options.kicker || "External Link"}</span>
      <h2>${data.title}</h2>
      ${data.owner ? `<p class="external-author">${data.owner}</p>` : ""}
      ${data.author ? `<p class="external-author">${data.author}</p>` : ""}
      <p class="external-description">${data.text}</p>
      ${data.stats ? `<div class="external-stats">${data.stats.map((item) => `<em>${item}</em>`).join("")}</div>` : ""}
      ${data.modified ? `<div class="external-stats"><em>更新：${data.modified}</em></div>` : ""}
      <div class="module-actions">
        <a class="module-link" href="${data.url}" target="_blank" rel="noreferrer">打开页面</a>
        ${data.homepage ? `<a class="module-link secondary-link" href="${data.homepage}" target="_blank" rel="noreferrer">打开主页</a>` : ""}
      </div>
      ${options.showSource && data.source ? `<small>${data.source}</small>` : ""}
    </div>
  `;
  fitExternalCard(root);
};

const formatCount = (value) => {
  const number = Number(value) || 0;
  if (number >= 10000) {
    const text = (number / 10000).toFixed(number >= 100000 ? 1 : 2).replace(/\.0+$/, "").replace(/(\.\d)0$/, "$1");
    return `${text}万`;
  }
  return String(number);
};

const normalizeBilibiliImage = (url) => {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  return url.replace(/^http:\/\//, "https://");
};

const extractBvid = (url = "") => (url.match(/BV[0-9A-Za-z]+/) || [])[0] || "";

const requestJsonp = (url) =>
  new Promise((resolve, reject) => {
    const callbackName = `portfolioBili_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const script = document.createElement("script");
    const separator = url.includes("?") ? "&" : "?";
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Bilibili request timed out"));
    }, 20000);
    const cleanup = () => {
      window.clearTimeout(timeout);
      script.remove();
      delete window[callbackName];
    };
    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("Bilibili request failed"));
    };
    script.src = `${url}${separator}callback=${callbackName}&jsonp=jsonp`;
    document.head.append(script);
  });

const requestBilibiliTopArc = async (vmid) => {
  const url = `https://api.bilibili.com/x/space/top/arc?vmid=${encodeURIComponent(vmid)}`;
  try {
    const response = await fetch(url, { mode: "cors" });
    if (response.ok) {
      const payload = await response.json();
      if (payload?.code === 0) return { payload, method: "fetch" };
    }
  } catch {
    // Some browsers or deployments may block Bilibili CORS; JSONP is the static-site fallback.
  }
  try {
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, { mode: "cors" });
    if (response.ok) {
      const payload = await response.json();
      if (payload?.code === 0) return { payload, method: "proxy" };
    }
  } catch {
    // Public proxy may be unavailable; JSONP is tried next.
  }
  const payload = await requestJsonp(url);
  if (payload?.code !== 0) throw new Error(`Bilibili top arc returned code ${payload?.code}`);
  return { payload, method: "jsonp" };
};

const requestBilibiliView = async (id) => {
  const idText = String(id || "");
  const isAid = /^\d+$/.test(idText);
  const url = isAid
    ? `https://api.bilibili.com/x/web-interface/view?aid=${encodeURIComponent(idText)}`
    : `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(idText)}`;
  try {
    const response = await fetch(url, { mode: "cors" });
    if (response.ok) {
      const payload = await response.json();
      if (payload?.code === 0) return { payload, method: "view-fetch" };
    }
  } catch {
    // JSONP fallback below keeps this working as a plain static page.
  }
  const payload = await requestJsonp(url);
  if (payload?.code !== 0) throw new Error(`Bilibili view returned code ${payload?.code}`);
  return { payload, method: "view-jsonp" };
};

const requestBilibiliUserInfo = async (vmid) => {
  const url = `https://api.bilibili.com/x/space/acc/info?mid=${encodeURIComponent(vmid)}`;
  try {
    const response = await fetch(url, { mode: "cors" });
    if (response.ok) {
      const payload = await response.json();
      if (payload?.code === 0) return { payload, method: "user-fetch" };
    }
  } catch {
    // JSONP fallback below.
  }
  const payload = await requestJsonp(url);
  if (payload?.code !== 0) throw new Error(`Bilibili user info returned code ${payload?.code}`);
  return { payload, method: "user-jsonp" };
};

const updateHeaderAvatarFromBilibili = async () => {
  if (!profileData.bilibiliVmid) return;
  try {
    const { payload } = await requestBilibiliUserInfo(profileData.bilibiliVmid);
    const avatar = normalizeBilibiliImage(payload?.data?.face || "");
    if (avatar && (await imageExists(avatar))) renderHeaderContact(avatar);
  } catch {
    // Keep the local fallback avatar from the maintenance entry.
  }
};

let bilibiliRefreshTimer = 0;
let bilibiliRefreshInFlight = false;
let bilibiliRefreshFailures = 0;

const updateBilibiliModuleFromApi = async () => {
  if (bilibiliRefreshInFlight) return false;
  bilibiliRefreshInFlight = true;
  const data = {
    ...content.bilibiliModule,
    vmid: profileData.bilibiliVmid || content.bilibiliModule.vmid,
    homepage: profileData.bilibiliHomepage || content.bilibiliModule.homepage,
  };
  const root = document.querySelector("[data-bilibili-module]");
  const vmid = data.vmid;
  if (!vmid) {
    root.dataset.biliStatus = "fallback-missing-vmid";
    bilibiliRefreshInFlight = false;
    return false;
  }
  try {
    const fallbackBvid = extractBvid(data.url);
    let method = "top";
    root.dataset.biliStatus = "loading-top";
    let topVideo = null;
    try {
      const topArc = await requestBilibiliTopArc(vmid);
      topVideo = topArc.payload?.data;
      method = `top-${topArc.method}`;
    } catch {
      // Fall back to the local BV only when the homepage pinned-video request is unavailable.
    }
    root.dataset.biliStatus = "loading-detail";
    let response = null;
    if (topVideo?.bvid || topVideo?.aid) {
      const view = await requestBilibiliView(topVideo.bvid || topVideo.aid);
      response = view.payload;
      method = `${method}+${view.method}`;
    } else if (fallbackBvid) {
      const view = await requestBilibiliView(fallbackBvid);
      response = view.payload;
      method = `fallback-${view.method}`;
    } else {
      throw new Error("Missing Bilibili pinned video and fallback BV id");
    }
    const video = response?.data;
    if (!video?.bvid && !video?.aid) {
      root.dataset.biliStatus = "fallback-empty";
      bilibiliRefreshFailures += 1;
      return false;
    }
    const dynamicImage = normalizeBilibiliImage(video.pic || "");
    const usableDynamicImage = dynamicImage && (await imageExists(dynamicImage)) ? dynamicImage : data.image;
    const dynamicData = {
      ...data,
      title: video.title || data.title,
      owner: video.owner?.name || data.owner,
      url: video.bvid
        ? `https://www.bilibili.com/video/${video.bvid}`
        : video.aid
          ? `https://www.bilibili.com/video/av${video.aid}`
          : data.url,
      image: usableDynamicImage,
      fallbackImage: data.image,
      stats: [
        `播放 ${formatCount(video.stat?.view ?? video.stat?.vv)}`,
        `点赞 ${formatCount(video.stat?.like)}`,
        `收藏 ${formatCount(video.stat?.favorite)}`,
        `评论 ${formatCount(video.stat?.reply)}`,
      ],
      text: video.desc || video.dynamic || "这个视频暂时没有公开简介。",
      source: "",
    };
    const ownerAvatar = normalizeBilibiliImage(video.owner?.face || "");
    if (ownerAvatar && (await imageExists(ownerAvatar))) renderHeaderContact(ownerAvatar);
    renderExternalModule("[data-bilibili-module]", dynamicData, root?._externalOptions || { kicker: "Bilibili" });
    document.querySelector("[data-bilibili-module]").dataset.biliStatus = method;
    syncExternalModuleHeights();
    bilibiliRefreshFailures = 0;
    return true;
  } catch {
    root.dataset.biliStatus = "fallback-error";
    // Keep the local fallback content when Bilibili blocks or rate-limits the request.
    bilibiliRefreshFailures += 1;
    return false;
  } finally {
    bilibiliRefreshInFlight = false;
  }
};

const scheduleBilibiliRefresh = (delay = 0) => {
  window.clearTimeout(bilibiliRefreshTimer);
  bilibiliRefreshTimer = window.setTimeout(async () => {
    const ok = await updateBilibiliModuleFromApi();
    const retryDelays = [15000, 30000, 60000, 120000, 300000];
    const nextDelay = ok ? 60000 : retryDelays[Math.min(bilibiliRefreshFailures - 1, retryDelays.length - 1)];
    scheduleBilibiliRefresh(nextDelay);
  }, delay);
};

const fitExternalCard = (root) => {
  const imageBox = root.querySelector(".external-image");
  const body = root.querySelector(".external-body");
  if (!imageBox || !body) return;

  const apply = () => {
    const imageHeight = Math.round(imageBox.getBoundingClientRect().height);
    if (!imageHeight) return;
    root.style.setProperty("--external-box-height", `${imageHeight}px`);
    body.style.setProperty("--external-text-scale", "1");
    const shrinkToFit = (attempt = 0) => {
      const neededHeight = body.scrollHeight;
      const currentScale = Number(getComputedStyle(body).getPropertyValue("--external-text-scale")) || 1;
      const nextScale =
        neededHeight > imageHeight ? Math.max(0.48, currentScale * (imageHeight / neededHeight) * 0.96) : currentScale;
      body.style.setProperty("--external-text-scale", nextScale.toFixed(3));
      if (neededHeight > imageHeight && attempt < 5 && nextScale > 0.48) {
        requestAnimationFrame(() => shrinkToFit(attempt + 1));
      }
    };
    requestAnimationFrame(() => shrinkToFit());
  };

  imageBox.querySelector("img")?.addEventListener("load", apply, { once: true });
  window.addEventListener("resize", apply);
  if ("ResizeObserver" in window) {
    root._externalResizeObserver = new ResizeObserver(apply);
    root._externalResizeObserver.observe(imageBox);
  }
  root._externalApply = apply;
  apply();
  return apply;
};

const syncExternalModuleHeights = () => {
  document.querySelectorAll(".external-card").forEach((root) => root._externalApply?.());
};

const maintainedBilibiliModule = {
  ...content.bilibiliModule,
  vmid: profileData.bilibiliVmid || content.bilibiliModule.vmid,
  homepage: profileData.bilibiliHomepage || content.bilibiliModule.homepage,
};

renderExternalModule("[data-bilibili-module]", maintainedBilibiliModule, {
  kicker: "Bilibili",
});

if (content.fanqieModule) {
  renderExternalModule("[data-fanqie-module]", content.fanqieModule, {
    kicker: "Fanqie Novel",
  });
}

syncExternalModuleHeights();
window.addEventListener("resize", syncExternalModuleHeights);
updateHeaderAvatarFromBilibili();
scheduleBilibiliRefresh(0);

const setupTextureTool = () => {
  const root = document.querySelector("[data-texture-tool]");
  if (!root) return;

  root.innerHTML = `
    <div class="texture-controls">
      <div class="texture-control">
        <label for="texture-input">上传贴图</label>
        <input id="texture-input" data-texture-input type="file" accept="image/*">
      </div>
      <div class="texture-control">
        <label for="texture-border">混合边宽 <span data-texture-border-label>33%</span></label>
        <input id="texture-border" data-texture-border type="range" min="4" max="50" value="33">
      </div>
      <div class="texture-control">
        <label for="texture-seed">随机种子</label>
        <input id="texture-seed" data-texture-seed type="number" min="0" max="4294967295" value="4256">
      </div>
      <div class="texture-control">
        <label for="texture-size">最大处理尺寸</label>
        <input id="texture-size" data-texture-size type="number" min="128" max="1024" step="64" value="512">
      </div>
    </div>
    <div class="texture-actions">
      <button type="button" data-texture-compute disabled>计算无缝贴图</button>
      <button type="button" data-texture-reroll disabled>换种子并计算</button>
      <button type="button" data-texture-preview disabled>显示 2x2 平铺预览</button>
      <button type="button" data-texture-source disabled>显示原图</button>
      <a data-texture-download href="#" download="tileable-texture.png" aria-disabled="true">下载结果</a>
    </div>
    <p class="texture-status" data-texture-status>上传一张随机性较强的自然纹理，例如石头、沙子、苔藓、木皮或噪声贴图。</p>
    <div class="texture-canvases">
      <article class="texture-canvas-card">
        <header><strong>输入</strong><span>Border Mask</span></header>
        <div class="texture-canvas-wrap"><canvas data-texture-input-canvas width="512" height="512"></canvas></div>
      </article>
      <article class="texture-canvas-card">
        <header><strong>输出</strong><span data-texture-output-label>Tileable</span></header>
        <div class="texture-canvas-wrap"><canvas data-texture-output-canvas width="512" height="512"></canvas></div>
      </article>
    </div>
    <p class="texture-note">浏览器会限制大图尺寸以保持响应速度。</p>
  `;

  const input = root.querySelector("[data-texture-input]");
  const border = root.querySelector("[data-texture-border]");
  const borderLabel = root.querySelector("[data-texture-border-label]");
  const seedInput = root.querySelector("[data-texture-seed]");
  const sizeInput = root.querySelector("[data-texture-size]");
  const computeButton = root.querySelector("[data-texture-compute]");
  const rerollButton = root.querySelector("[data-texture-reroll]");
  const previewButton = root.querySelector("[data-texture-preview]");
  const sourceButton = root.querySelector("[data-texture-source]");
  const downloadLink = root.querySelector("[data-texture-download]");
  const status = root.querySelector("[data-texture-status]");
  const inputCanvas = root.querySelector("[data-texture-input-canvas]");
  const outputCanvas = root.querySelector("[data-texture-output-canvas]");
  const outputLabel = root.querySelector("[data-texture-output-label]");
  const inputContext = inputCanvas.getContext("2d", { willReadFrequently: true });
  const outputContext = outputCanvas.getContext("2d");

  let sourceImage = null;
  let outputImageData = null;
  let outputDataUrl = "";
  let showTiled = false;
  let showOriginal = false;

  const setStatus = (text) => {
    status.textContent = text;
  };

  const clampByte = (value) => Math.max(0, Math.min(255, Math.round(value)));
  const modulo = (value, size) => ((value % size) + size) % size;
  const createRng = (seed) => {
    let state = Number(seed) >>> 0;
    return () => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return ((state >>> 0) / 4294967296);
    };
  };

  const erfApprox = (x) => {
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * ax);
    const y =
      1 -
      (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
        t *
        Math.exp(-ax * ax));
    return sign * y;
  };

  const erfinvApprox = (x) => {
    const safeX = clampValue(x, -0.999999, 0.999999);
    let w = -Math.log((1 - safeX) * (1 + safeX));
    let p;
    if (w < 5) {
      w -= 2.5;
      p = 2.81022636e-8;
      p = 3.43273939e-7 + p * w;
      p = -3.5233877e-6 + p * w;
      p = -4.39150654e-6 + p * w;
      p = 0.00021858087 + p * w;
      p = -0.00125372503 + p * w;
      p = -0.00417768164 + p * w;
      p = 0.246640727 + p * w;
      p = 1.50140941 + p * w;
    } else {
      w = Math.sqrt(w) - 3;
      p = -0.000200214257;
      p = 0.000100950558 + p * w;
      p = 0.00134934322 + p * w;
      p = -0.00367342844 + p * w;
      p = 0.00573950773 + p * w;
      p = -0.0076224613 + p * w;
      p = 0.00943887047 + p * w;
      p = 1.00167406 + p * w;
      p = 2.83297682 + p * w;
    }
    return p * safeX;
  };

  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  const computeEigenVectors = (data) => {
    const count = data.length / 3;
    const mean = [0, 0, 0];
    for (let index = 0; index < data.length; index += 3) {
      mean[0] += data[index];
      mean[1] += data[index + 1];
      mean[2] += data[index + 2];
    }
    mean[0] /= count;
    mean[1] /= count;
    mean[2] /= count;
    const a = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (let index = 0; index < data.length; index += 3) {
      const r = data[index] - mean[0];
      const g = data[index + 1] - mean[1];
      const b = data[index + 2] - mean[2];
      a[0][0] += r * r;
      a[0][1] += r * g;
      a[0][2] += r * b;
      a[1][1] += g * g;
      a[1][2] += g * b;
      a[2][2] += b * b;
    }
    a[1][0] = a[0][1];
    a[2][0] = a[0][2];
    a[2][1] = a[1][2];
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) a[row][col] /= count;
    }
    const v = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    for (let iter = 0; iter < 36; iter += 1) {
      let p = 0;
      let q = 1;
      let max = Math.abs(a[0][1]);
      if (Math.abs(a[0][2]) > max) {
        p = 0;
        q = 2;
        max = Math.abs(a[0][2]);
      }
      if (Math.abs(a[1][2]) > max) {
        p = 1;
        q = 2;
        max = Math.abs(a[1][2]);
      }
      if (max < 1e-8) break;
      const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1);
      const s = t * c;
      const app = a[p][p];
      const aqq = a[q][q];
      const apq = a[p][q];
      a[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
      a[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
      a[p][q] = 0;
      a[q][p] = 0;
      for (let k = 0; k < 3; k += 1) {
        if (k === p || k === q) continue;
        const akp = a[k][p];
        const akq = a[k][q];
        a[k][p] = c * akp - s * akq;
        a[p][k] = a[k][p];
        a[k][q] = s * akp + c * akq;
        a[q][k] = a[k][q];
      }
      for (let k = 0; k < 3; k += 1) {
        const vkp = v[k][p];
        const vkq = v[k][q];
        v[k][p] = c * vkp - s * vkq;
        v[k][q] = s * vkp + c * vkq;
      }
    }
    return [0, 1, 2].map((axis) => {
      const vector = [v[0][axis], v[1][axis], v[2][axis]];
      const len = Math.hypot(vector[0], vector[1], vector[2]) || 1;
      return [vector[0] / len, vector[1] / len, vector[2] / len];
    });
  };

  const imageDataToRgb = (imageData) => {
    const out = new Float32Array(imageData.width * imageData.height * 3);
    const src = imageData.data;
    for (let index = 0, dst = 0; index < src.length; index += 4, dst += 3) {
      out[dst] = src[index];
      out[dst + 1] = src[index + 1];
      out[dst + 2] = src[index + 2];
    }
    return out;
  };

  const removeGradient = (data, width, height) => {
    const out = new Float32Array(data);
    const lastX = width - 1;
    const lastY = height - 1;
    const gradX = [0, 0, 0];
    const gradY = [0, 0, 0];
    for (let y = 0; y < height; y += 1) {
      const left = (y * width) * 3;
      const right = (y * width + lastX) * 3;
      gradX[0] += data[right] - data[left];
      gradX[1] += data[right + 1] - data[left + 1];
      gradX[2] += data[right + 2] - data[left + 2];
    }
    for (let x = 0; x < width; x += 1) {
      const top = x * 3;
      const bottom = (lastY * width + x) * 3;
      gradY[0] += data[bottom] - data[top];
      gradY[1] += data[bottom + 1] - data[top + 1];
      gradY[2] += data[bottom + 2] - data[top + 2];
    }
    for (let c = 0; c < 3; c += 1) {
      gradX[c] /= height;
      gradY[c] /= width;
    }
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const fx = width > 1 ? -0.5 + x / lastX : 0;
        const fy = height > 1 ? -0.5 + y / lastY : 0;
        const index = (y * width + x) * 3;
        out[index] -= fx * gradX[0] + fy * gradY[0];
        out[index + 1] -= fx * gradX[1] + fy * gradY[1];
        out[index + 2] -= fx * gradX[2] + fy * gradY[2];
      }
    }
    return out;
  };

  const toGaussianHistogram = (data, width, height, eigenVectors) => {
    const count = width * height;
    const projected = [new Array(count), new Array(count), new Array(count)];
    for (let pixel = 0; pixel < count; pixel += 1) {
      const rgb = [data[pixel * 3], data[pixel * 3 + 1], data[pixel * 3 + 2]];
      for (let axis = 0; axis < 3; axis += 1) {
        projected[axis][pixel] = { pixel, value: dot3(rgb, eigenVectors[axis]) };
      }
    }
    const out = new Float32Array(count * 3);
    for (let axis = 0; axis < 3; axis += 1) {
      projected[axis].sort((a, b) => a.value - b.value);
      for (let rank = 0; rank < count; rank += 1) {
        const u = (rank + 0.5) / count;
        out[projected[axis][rank].pixel * 3 + axis] = Math.SQRT2 * erfinvApprox(2 * u - 1);
      }
    }
    return out;
  };

  const mapBackHistogram = (gaussianData, targetData, width, height, eigenVectors) => {
    const count = width * height;
    const sorted = [new Float32Array(count), new Float32Array(count), new Float32Array(count)];
    for (let pixel = 0; pixel < count; pixel += 1) {
      const rgb = [targetData[pixel * 3], targetData[pixel * 3 + 1], targetData[pixel * 3 + 2]];
      for (let axis = 0; axis < 3; axis += 1) sorted[axis][pixel] = dot3(rgb, eigenVectors[axis]);
    }
    for (let axis = 0; axis < 3; axis += 1) {
      sorted[axis] = Float32Array.from(Array.from(sorted[axis]).sort((a, b) => a - b));
    }
    const out = new Uint8ClampedArray(count * 4);
    for (let pixel = 0; pixel < count; pixel += 1) {
      const comps = [0, 0, 0];
      for (let axis = 0; axis < 3; axis += 1) {
        const u = clampValue(0.5 + 0.5 * erfApprox(gaussianData[pixel * 3 + axis] / Math.SQRT2), 0, 0.999999);
        comps[axis] = sorted[axis][Math.floor(u * count)];
      }
      const rgb = [
        eigenVectors[0][0] * comps[0] + eigenVectors[1][0] * comps[1] + eigenVectors[2][0] * comps[2],
        eigenVectors[0][1] * comps[0] + eigenVectors[1][1] * comps[1] + eigenVectors[2][1] * comps[2],
        eigenVectors[0][2] * comps[0] + eigenVectors[1][2] * comps[1] + eigenVectors[2][2] * comps[2],
      ];
      out[pixel * 4] = clampByte(rgb[0]);
      out[pixel * 4 + 1] = clampByte(rgb[1]);
      out[pixel * 4 + 2] = clampByte(rgb[2]);
      out[pixel * 4 + 3] = 255;
    }
    return new ImageData(out, width, height);
  };

  const variancePreservingBlend = (gaussianData, width, height, borderSize, seed) => {
    const out = new Float32Array(gaussianData.length);
    const rng = createRng(seed);
    const offsetX = Math.floor(rng() * width);
    const offsetY = Math.floor(rng() * height);
    const offsetXY = Math.floor(rng() * width);
    const offsetYX = Math.floor(rng() * height);
    const sample = (x, y, c) => gaussianData[(modulo(y, height) * width + modulo(x, width)) * 3 + c];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const edgeX = Math.min(x, width - 1 - x);
        const edgeY = Math.min(y, height - 1 - y);
        const bx = edgeX < borderSize ? 1 - edgeX / borderSize : 0;
        const by = edgeY < borderSize ? 1 - edgeY / borderSize : 0;
        const seamX = x < borderSize ? x : width - 1 - x;
        const seamY = y < borderSize ? y : height - 1 - y;
        const weights = [
          (1 - bx) * (1 - by),
          bx * (1 - by),
          (1 - bx) * by,
          bx * by,
        ];
        const denom = Math.sqrt(weights.reduce((sum, weight) => sum + weight * weight, 0)) || 1;
        for (let c = 0; c < 3; c += 1) {
          const center = sample(x, y, c);
          const horizontal = sample(seamX + offsetX, y + offsetY, c);
          const vertical = sample(x + offsetYX, seamY + offsetXY, c);
          const corner = sample(seamX + offsetX, seamY + offsetXY, c);
          out[(y * width + x) * 3 + c] =
            (weights[0] * center + weights[1] * horizontal + weights[2] * vertical + weights[3] * corner) / denom;
        }
      }
    }
    return out;
  };

  const drawInputPreview = () => {
    if (!sourceImage) return;
    inputCanvas.width = sourceImage.width;
    inputCanvas.height = sourceImage.height;
    inputContext.putImageData(sourceImage.imageData, 0, 0);
    const b = Math.max(2, Math.floor((Number(border.value) / 100) * Math.min(sourceImage.width, sourceImage.height) / 2));
    inputContext.save();
    inputContext.strokeStyle = "rgba(38, 135, 199, 0.95)";
    inputContext.lineWidth = Math.max(2, Math.ceil(Math.min(sourceImage.width, sourceImage.height) / 180));
    inputContext.strokeRect(b, b, sourceImage.width - b * 2, sourceImage.height - b * 2);
    inputContext.globalAlpha = 0.22;
    inputContext.fillStyle = "#2687c7";
    inputContext.fillRect(0, 0, sourceImage.width, b);
    inputContext.fillRect(0, sourceImage.height - b, sourceImage.width, b);
    inputContext.fillRect(0, 0, b, sourceImage.height);
    inputContext.fillRect(sourceImage.width - b, 0, b, sourceImage.height);
    inputContext.restore();
  };

  const drawOutput = () => {
    if (!sourceImage) return;
    const image = showOriginal ? sourceImage.imageData : outputImageData;
    if (!image) return;
    outputCanvas.width = showTiled ? image.width * 2 : image.width;
    outputCanvas.height = showTiled ? image.height * 2 : image.height;
    outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    if (showTiled) {
      for (let y = 0; y < 2; y += 1) {
        for (let x = 0; x < 2; x += 1) outputContext.putImageData(image, x * image.width, y * image.height);
      }
    } else {
      outputContext.putImageData(image, 0, 0);
    }
    outputLabel.textContent = showOriginal ? "Original" : showTiled ? "2x2 Preview" : "Tileable";
  };

  const computeTileable = async (reroll = false) => {
    if (!sourceImage) return;
    if (reroll) seedInput.value = String((Number(seedInput.value) + 104729) >>> 0);
    computeButton.disabled = true;
    rerollButton.disabled = true;
    setStatus("正在计算：梯度去除与直方图高斯化...");
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const { width, height } = sourceImage;
    const borderSize = Math.max(2, Math.floor((Number(border.value) / 100) * Math.min(width, height) / 2));
    const noGradient = removeGradient(sourceImage.rgb, width, height);
    const eigenVectors = computeEigenVectors(noGradient);
    const gaussian = toGaussianHistogram(noGradient, width, height, eigenVectors);
    setStatus("正在计算：边界方差保持混合...");
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const blended = variancePreservingBlend(gaussian, width, height, borderSize, Number(seedInput.value));
    setStatus("正在计算：映射回原始贴图直方图...");
    await new Promise((resolve) => requestAnimationFrame(resolve));
    outputImageData = mapBackHistogram(blended, noGradient, width, height, eigenVectors);
    showOriginal = false;
    showTiled = false;
    drawOutput();
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = width;
    exportCanvas.height = height;
    exportCanvas.getContext("2d").putImageData(outputImageData, 0, 0);
    outputDataUrl = exportCanvas.toDataURL("image/png");
    downloadLink.href = outputDataUrl;
    downloadLink.setAttribute("aria-disabled", "false");
    previewButton.disabled = false;
    sourceButton.disabled = false;
    computeButton.disabled = false;
    rerollButton.disabled = false;
    setStatus(`完成：输出 ${width} x ${height}，边宽 ${border.value}%，种子 ${seedInput.value}。`);
  };

  const loadImageFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = clampValue(Number(sizeInput.value) || 512, 128, 1024);
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(8, Math.round(image.width * scale));
        const height = Math.max(8, Math.round(image.height * scale));
        inputCanvas.width = width;
        inputCanvas.height = height;
        inputContext.clearRect(0, 0, width, height);
        inputContext.drawImage(image, 0, 0, width, height);
        const imageData = inputContext.getImageData(0, 0, width, height);
        sourceImage = { width, height, imageData, rgb: imageDataToRgb(imageData) };
        outputImageData = null;
        outputDataUrl = "";
        showOriginal = false;
        showTiled = false;
        downloadLink.setAttribute("aria-disabled", "true");
        computeButton.disabled = false;
        rerollButton.disabled = false;
        previewButton.disabled = true;
        sourceButton.disabled = true;
        drawInputPreview();
        outputContext.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
        setStatus(`已载入 ${width} x ${height}。点击“计算无缝贴图”开始处理。`);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) loadImageFile(file);
  });
  border.addEventListener("input", () => {
    borderLabel.textContent = `${border.value}%`;
    drawInputPreview();
  });
  computeButton.addEventListener("click", () => computeTileable(false));
  rerollButton.addEventListener("click", () => computeTileable(true));
  previewButton.addEventListener("click", () => {
    showTiled = !showTiled;
    previewButton.textContent = showTiled ? "隐藏 2x2 平铺预览" : "显示 2x2 平铺预览";
    drawOutput();
  });
  sourceButton.addEventListener("click", () => {
    showOriginal = !showOriginal;
    sourceButton.textContent = showOriginal ? "显示无缝结果" : "显示原图";
    drawOutput();
  });
};

setupTextureTool();

const setupMiniGames = () => {
  const root = document.querySelector("[data-mini-game]");
  if (!root) return;
  const canvas = root.querySelector("[data-game-board]");
  const context = canvas?.getContext("2d");
  const gameSelect = root.querySelector("[data-game-select]");
  const gameTitle = root.querySelector("[data-game-title]");
  const startButton = root.querySelector("[data-game-start]");
  const scoreName = root.querySelector("[data-score-name]");
  const scoreLabel = root.querySelector("[data-game-score]");
  const status = root.querySelector("[data-game-status]");
  const modeRoot = root.querySelector(".snake-modes");
  const modeButtons = [...root.querySelectorAll("[data-snake-mode]")];
  if (!canvas || !context || !gameSelect || !gameTitle || !startButton || !scoreName || !scoreLabel || !status) return;

  const width = canvas.width;
  const height = canvas.height;
  const keys = new Set();
  let currentGame = "snake";
  let snakeMode = "classic";
  let active = false;
  let intervalId = 0;
  let timeoutId = 0;
  let animationId = 0;
  let lastFrame = 0;

  const readColors = () => {
    const styles = getComputedStyle(document.documentElement);
    return {
      board: "#081018",
      grid: "rgba(255, 255, 255, 0.055)",
      primary: styles.getPropertyValue("--gold").trim() || "#d8aa68",
      bright: styles.getPropertyValue("--accent-strong").trim() || "#ffffff",
      food: "#ef5350",
      ink: "#f5f7fa",
    };
  };
  const clearBoard = (grid = false) => {
    const colors = readColors();
    context.fillStyle = colors.board;
    context.fillRect(0, 0, width, height);
    if (!grid) return;
    context.strokeStyle = colors.grid;
    context.lineWidth = 1;
    for (let x = 30; x < width; x += 30) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 30; y < height; y += 30) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
  };
  const stopGame = () => {
    active = false;
    window.clearInterval(intervalId);
    window.clearTimeout(timeoutId);
    window.cancelAnimationFrame(animationId);
    intervalId = 0;
    timeoutId = 0;
    animationId = 0;
    keys.clear();
  };
  const finishGame = (message) => {
    stopGame();
    startButton.textContent = "重新开始";
    status.textContent = message;
  };
  const startFrameLoop = (update) => {
    lastFrame = performance.now();
    const frame = (time) => {
      if (!active) return;
      const delta = Math.min(0.032, (time - lastFrame) / 1000);
      lastFrame = time;
      update(delta);
      animationId = window.requestAnimationFrame(frame);
    };
    animationId = window.requestAnimationFrame(frame);
  };
  const animateVisual = (duration, drawFrame) =>
    new Promise((resolve) => {
      const startedAt = performance.now();
      const frame = (time) => {
        const progress = Math.min(1, (time - startedAt) / duration);
        drawFrame(progress);
        if (progress < 1) window.requestAnimationFrame(frame);
        else resolve();
      };
      window.requestAnimationFrame(frame);
    });
  const playBurstEffect = (drawBase, origins, options = {}) => {
    const duration = options.duration || 360;
    const count = options.count || 12;
    const color = options.color || readColors().bright;
    animateVisual(duration, (progress) => {
      drawBase();
      origins.forEach((origin, originIndex) => {
        for (let index = 0; index < count; index += 1) {
          const angle = (Math.PI * 2 * index) / count + originIndex * 0.37;
          const distance = progress * (options.distance || 44) * (0.55 + (index % 4) * 0.14);
          const size = Math.max(1, (options.size || 8) * (1 - progress));
          context.save();
          context.globalAlpha = 1 - progress;
          context.translate(origin.x + Math.cos(angle) * distance, origin.y + Math.sin(angle) * distance);
          context.rotate(angle + progress * 2.4);
          context.fillStyle = origin.color || color;
          context.fillRect(-size / 2, -size / 2, size, size);
          context.restore();
        }
      });
    });
  };
  const arcadeParticles = [];
  const spawnArcadeBurst = (x, y, colors, count = 24, speed = 150) => {
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.3;
      const velocity = speed * (0.55 + Math.random() * 0.75);
      arcadeParticles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 0.48 + Math.random() * 0.28,
        maxLife: 0.76,
        size: 4 + Math.random() * 7,
        color: colors[index % colors.length],
      });
    }
  };
  const updateArcadeParticles = (delta) => {
    for (let index = arcadeParticles.length - 1; index >= 0; index -= 1) {
      const particle = arcadeParticles[index];
      particle.life -= delta;
      if (particle.life <= 0) {
        arcadeParticles.splice(index, 1);
        continue;
      }
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vx *= Math.pow(0.035, delta);
      particle.vy = particle.vy * Math.pow(0.05, delta) + 130 * delta;
    }
  };
  const drawArcadeParticles = () => {
    arcadeParticles.forEach((particle) => {
      context.save();
      context.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      context.fillStyle = particle.color;
      context.translate(particle.x, particle.y);
      context.rotate(particle.life * 7);
      context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      context.restore();
    });
  };
  const pokemonTileColors = ["#69b96b", "#f08a45", "#62a9d8", "#91bd48", "#c58a4d", "#c9a861", "#9b75b8", "#b77b57", "#c2d455", "#8298a8", "#d5b74b", "#b9d9e7"];
  const pokemonTileImages = Array.from({ length: 12 }, (_, index) => {
    const image = new Image();
    image.src = `assets/external/pokemon-tiles/pokemon-${String(index + 1).padStart(3, "0")}.png`;
    image.addEventListener("load", () => {
      if (currentGame === "match3") drawMatch3();
      if (currentGame === "link") drawLinkGame();
    });
    return image;
  });
  const drawTilePattern = (value, centerX, centerY, radius) => {
    const image = pokemonTileImages[value % pokemonTileImages.length];
    context.save();
    context.imageSmoothingEnabled = false;
    if (image.complete && image.naturalWidth) {
      const size = radius * 2.45;
      context.drawImage(image, centerX - size / 2, centerY - size / 2, size, size);
    } else {
      context.fillStyle = "rgba(255,255,255,.86)";
      context.beginPath();
      context.arc(centerX, centerY, radius * 0.48, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  };

  const snake = {
    columns: 32,
    rows: 18,
    body: [],
    foods: [],
    direction: { x: 1, y: 0 },
    queued: { x: 1, y: 0 },
    buffetDelay: 700,
    score: 0,
  };
  const placeSnakeFood = () => {
    const free = [];
    for (let y = 0; y < snake.rows; y += 1) {
      for (let x = 0; x < snake.columns; x += 1) {
        if (
          !snake.body.some((part) => part.x === x && part.y === y) &&
          !snake.foods.some((food) => food.x === x && food.y === y)
        ) {
          free.push({ x, y });
        }
      }
    }
    const food = free[Math.floor(Math.random() * free.length)];
    if (food) snake.foods.push(food);
  };
  const drawSnake = () => {
    clearBoard(true);
    const colors = readColors();
    const size = width / snake.columns;
    const drawCell = (point, color, inset) => {
      context.fillStyle = color;
      context.fillRect(point.x * size + inset, point.y * size + inset, size - inset * 2, size - inset * 2);
    };
    snake.foods.forEach((food) => drawCell(food, colors.food, 5));
    snake.body.forEach((part, index) => drawCell(part, index === 0 ? colors.bright : colors.primary, index === 0 ? 1 : 3));
  };
  const scheduleBuffet = () => {
    window.clearTimeout(timeoutId);
    if (!active || currentGame !== "snake" || snakeMode !== "buffet") return;
    timeoutId = window.setTimeout(() => {
      placeSnakeFood();
      drawSnake();
      snake.buffetDelay = Math.max(140, snake.buffetDelay * 0.965);
      scheduleBuffet();
    }, snake.buffetDelay);
  };
  const stepSnake = () => {
    snake.direction = snake.queued;
    const head = { x: snake.body[0].x + snake.direction.x, y: snake.body[0].y + snake.direction.y };
    const hitWall = head.x < 0 || head.y < 0 || head.x >= snake.columns || head.y >= snake.rows;
    if (snakeMode === "buffet" && hitWall) {
      head.x = (head.x + snake.columns) % snake.columns;
      head.y = (head.y + snake.rows) % snake.rows;
    }
    if ((snakeMode !== "buffet" && hitWall) || snake.body.some((part) => part.x === head.x && part.y === head.y)) {
      finishGame(`游戏结束，得分 ${snake.score}`);
      drawSnake();
      return;
    }
    snake.body.unshift(head);
    const eaten = snake.foods.findIndex((food) => food.x === head.x && food.y === head.y);
    if (eaten >= 0) {
      const eatenFood = snake.foods[eaten];
      snake.foods.splice(eaten, 1);
      snake.score += 1;
      scoreLabel.textContent = String(snake.score);
      if (snakeMode === "classic") placeSnakeFood();
      const size = width / snake.columns;
      playBurstEffect(drawSnake, [{ x: eatenFood.x * size + size / 2, y: eatenFood.y * size + size / 2, color: readColors().food }], {
        count: 7,
        distance: 24,
        duration: 220,
      });
    } else {
      snake.body.pop();
    }
    drawSnake();
  };
  const startSnake = () => {
    snake.body = [{ x: 16, y: 9 }, { x: 15, y: 9 }, { x: 14, y: 9 }];
    snake.foods = [];
    snake.direction = { x: 1, y: 0 };
    snake.queued = { x: 1, y: 0 };
    snake.buffetDelay = 700;
    snake.score = 0;
    scoreLabel.textContent = "0";
    placeSnakeFood();
    drawSnake();
    intervalId = window.setInterval(stepSnake, 105);
    if (snakeMode === "buffet") scheduleBuffet();
  };

  const pong = {
    playerY: 220,
    playerVelocity: 0,
    aiY: 220,
    playerScore: 0,
    aiScore: 0,
    ball: { x: 480, y: 270, vx: 330, vy: 170 },
  };
  const resetPongBall = (direction = 1) => {
    pong.ball = { x: width / 2, y: height / 2, vx: 330 * direction, vy: (Math.random() * 220 - 110) || 120 };
  };
  const drawPong = () => {
    clearBoard();
    const colors = readColors();
    context.setLineDash([10, 14]);
    context.strokeStyle = colors.grid;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(width / 2, 18);
    context.lineTo(width / 2, height - 18);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = colors.primary;
    context.fillRect(28, pong.playerY, 16, 100);
    context.fillStyle = colors.bright;
    context.fillRect(width - 44, pong.aiY, 16, 100);
    context.beginPath();
    context.arc(pong.ball.x, pong.ball.y, 11, 0, Math.PI * 2);
    context.fill();
  };
  const updatePong = (delta) => {
    const previousPlayerY = pong.playerY;
    if (keys.has("w")) pong.playerY -= 430 * delta;
    if (keys.has("s")) pong.playerY += 430 * delta;
    pong.playerY = clampValue(pong.playerY, 0, height - 100);
    pong.playerVelocity = delta > 0 ? (pong.playerY - previousPlayerY) / delta : 0;
    pong.aiY += Math.sign(pong.ball.y - (pong.aiY + 50)) * 185 * delta;
    pong.aiY = clampValue(pong.aiY, 0, height - 100);
    pong.ball.x += pong.ball.vx * delta;
    pong.ball.y += pong.ball.vy * delta;
    if (pong.ball.y <= 11 || pong.ball.y >= height - 11) pong.ball.vy *= -1;
    const hitPlayer = pong.ball.x <= 48 && pong.ball.x >= 25 && pong.ball.y >= pong.playerY && pong.ball.y <= pong.playerY + 100;
    const hitAi = pong.ball.x >= width - 48 && pong.ball.x <= width - 25 && pong.ball.y >= pong.aiY && pong.ball.y <= pong.aiY + 100;
    if (hitPlayer && pong.ball.vx < 0) {
      pong.ball.vx = Math.abs(pong.ball.vx) * 1.035;
      pong.ball.vy = clampValue(pong.ball.vy + pong.playerVelocity * 0.72, -520, 520);
    }
    if (hitAi && pong.ball.vx > 0) pong.ball.vx = -Math.abs(pong.ball.vx) * 1.025;
    if (pong.ball.x < -20) {
      pong.aiScore += 1;
      resetPongBall(1);
      playBurstEffect(drawPong, [{ x: 32, y: height / 2, color: readColors().food }], { count: 12, distance: 46 });
    } else if (pong.ball.x > width + 20) {
      pong.playerScore += 1;
      resetPongBall(-1);
      playBurstEffect(drawPong, [{ x: width - 32, y: height / 2 }], { count: 12, distance: 46 });
    }
    scoreLabel.textContent = `${pong.playerScore} : ${pong.aiScore}`;
    drawPong();
  };
  const startPong = () => {
    pong.playerY = 220;
    pong.playerVelocity = 0;
    pong.aiY = 220;
    pong.playerScore = 0;
    pong.aiScore = 0;
    resetPongBall(Math.random() > 0.5 ? 1 : -1);
    scoreLabel.textContent = "0 : 0";
    drawPong();
    startFrameLoop(updatePong);
  };

  const breakout = {
    paddleX: 405,
    ball: { x: 480, y: 440, vx: 250, vy: -280 },
    bricks: [],
    score: 0,
    lives: 3,
  };
  const resetBreakoutBall = () => {
    breakout.paddleX = 405;
    breakout.ball = { x: width / 2, y: height - 100, vx: Math.random() > 0.5 ? 250 : -250, vy: -280 };
  };
  const buildBricks = () => {
    breakout.bricks = [];
    for (let row = 0; row < 5; row += 1) {
      for (let column = 0; column < 12; column += 1) {
        breakout.bricks.push({ x: 22 + column * 77, y: 34 + row * 34, w: 69, h: 24, alive: true });
      }
    }
  };
  const drawBreakout = () => {
    clearBoard();
    const colors = readColors();
    breakout.bricks.forEach((brick, index) => {
      if (!brick.alive) return;
      context.fillStyle = index % 2 ? colors.primary : colors.bright;
      context.fillRect(brick.x, brick.y, brick.w, brick.h);
    });
    context.fillStyle = colors.primary;
    context.fillRect(breakout.paddleX, height - 36, 150, 16);
    context.fillStyle = colors.bright;
    context.beginPath();
    context.arc(breakout.ball.x, breakout.ball.y, 10, 0, Math.PI * 2);
    context.fill();
    drawArcadeParticles();
  };
  const updateBreakout = (delta) => {
    updateArcadeParticles(delta);
    if (keys.has("a")) breakout.paddleX -= 440 * delta;
    if (keys.has("d")) breakout.paddleX += 440 * delta;
    breakout.paddleX = clampValue(breakout.paddleX, 0, width - 150);
    breakout.ball.x += breakout.ball.vx * delta;
    breakout.ball.y += breakout.ball.vy * delta;
    if (breakout.ball.x <= 10 || breakout.ball.x >= width - 10) breakout.ball.vx *= -1;
    if (breakout.ball.y <= 10) breakout.ball.vy = Math.abs(breakout.ball.vy);
    if (
      breakout.ball.vy > 0 &&
      breakout.ball.y >= height - 48 &&
      breakout.ball.y <= height - 20 &&
      breakout.ball.x >= breakout.paddleX &&
      breakout.ball.x <= breakout.paddleX + 150
    ) {
      breakout.ball.vy = -Math.abs(breakout.ball.vy);
      breakout.ball.vx += (breakout.ball.x - (breakout.paddleX + 75)) * 2;
    }
    for (const brick of breakout.bricks) {
      if (
        brick.alive &&
        breakout.ball.x >= brick.x &&
        breakout.ball.x <= brick.x + brick.w &&
        breakout.ball.y >= brick.y &&
        breakout.ball.y <= brick.y + brick.h
      ) {
        brick.alive = false;
        breakout.ball.vy *= -1;
        breakout.score += 10;
        scoreLabel.textContent = String(breakout.score);
        spawnArcadeBurst(brick.x + brick.w / 2, brick.y + brick.h / 2, [readColors().primary, readColors().bright], 32, 210);
        break;
      }
    }
    if (breakout.bricks.every((brick) => !brick.alive)) {
      finishGame(`全部清除，得分 ${breakout.score}`);
    } else if (breakout.ball.y > height + 15) {
      breakout.lives -= 1;
      if (breakout.lives <= 0) finishGame(`游戏结束，得分 ${breakout.score}`);
      else {
        status.textContent = `剩余 ${breakout.lives} 条生命`;
        resetBreakoutBall();
      }
    }
    drawBreakout();
  };
  const startBreakout = () => {
    arcadeParticles.length = 0;
    breakout.score = 0;
    breakout.lives = 3;
    buildBricks();
    resetBreakoutBall();
    scoreLabel.textContent = "0";
    drawBreakout();
    startFrameLoop(updateBreakout);
  };

  const shooter = {
    player: { x: 80, y: 270 },
    bullets: [],
    enemies: [],
    score: 0,
    spawnClock: 0,
    shotClock: 0,
  };
  const drawShooter = () => {
    clearBoard();
    const colors = readColors();
    context.fillStyle = colors.grid;
    for (let index = 0; index < 70; index += 1) {
      const x = (index * 137) % width;
      const y = (index * 83) % height;
      context.fillRect(x, y, 2, 2);
    }
    context.fillStyle = colors.primary;
    context.beginPath();
    context.moveTo(shooter.player.x + 22, shooter.player.y);
    context.lineTo(shooter.player.x - 20, shooter.player.y - 18);
    context.lineTo(shooter.player.x - 20, shooter.player.y + 18);
    context.closePath();
    context.fill();
    context.fillStyle = colors.bright;
    shooter.bullets.forEach((bullet) => context.fillRect(bullet.x, bullet.y - 2, 14, 4));
    context.fillStyle = colors.food;
    shooter.enemies.forEach((enemy) => context.fillRect(enemy.x - 15, enemy.y - 12, 30, 24));
    drawArcadeParticles();
  };
  const updateShooter = (delta) => {
    updateArcadeParticles(delta);
    const move = 380 * delta;
    if (keys.has("w")) shooter.player.y -= move;
    if (keys.has("s")) shooter.player.y += move;
    shooter.player.y = clampValue(shooter.player.y, 24, height - 24);
    shooter.spawnClock += delta;
    shooter.shotClock += delta;
    if (shooter.spawnClock >= Math.max(0.2, 0.72 - shooter.score * 0.004)) {
      shooter.spawnClock = 0;
      shooter.enemies.push({ x: width + 25, y: 24 + Math.random() * (height - 48), speed: 145 + Math.random() * 115 });
    }
    if (shooter.shotClock >= 0.16) {
      shooter.shotClock = 0;
      shooter.bullets.push({ x: shooter.player.x + 22, y: shooter.player.y });
    }
    shooter.bullets.forEach((bullet) => (bullet.x += 590 * delta));
    shooter.enemies.forEach((enemy) => (enemy.x -= enemy.speed * delta));
    for (const enemy of shooter.enemies) {
      const hitPlayer = Math.abs(enemy.x - shooter.player.x) < 30 && Math.abs(enemy.y - shooter.player.y) < 30;
      if (hitPlayer || enemy.x < -25) {
        finishGame(`游戏结束，得分 ${shooter.score}`);
        drawShooter();
        return;
      }
    }
    shooter.enemies = shooter.enemies.filter((enemy) => {
      const bulletIndex = shooter.bullets.findIndex((bullet) => Math.abs(bullet.x - enemy.x) < 20 && Math.abs(bullet.y - enemy.y) < 18);
      if (bulletIndex < 0) return true;
      shooter.bullets.splice(bulletIndex, 1);
      shooter.score += 1;
      scoreLabel.textContent = String(shooter.score);
      spawnArcadeBurst(enemy.x, enemy.y, [readColors().food, readColors().bright, readColors().primary], 28, 190);
      return false;
    });
    shooter.bullets = shooter.bullets.filter((bullet) => bullet.x < width + 20);
    drawShooter();
  };
  const startShooter = () => {
    arcadeParticles.length = 0;
    shooter.player = { x: 80, y: 270 };
    shooter.bullets = [];
    shooter.enemies = [];
    shooter.score = 0;
    shooter.spawnClock = 0;
    shooter.shotClock = 0;
    scoreLabel.textContent = "0";
    drawShooter();
    startFrameLoop(updateShooter);
  };

  const dodge = {
    player: { x: 465, y: 455, size: 30 },
    blocks: [],
    score: 0,
    spawnClock: 0,
    elapsed: 0,
  };
  const drawDodge = () => {
    clearBoard(true);
    const colors = readColors();
    context.fillStyle = colors.primary;
    context.fillRect(dodge.player.x, dodge.player.y, dodge.player.size, dodge.player.size);
    context.fillStyle = colors.food;
    dodge.blocks.forEach((block) => context.fillRect(block.x, block.y, block.size, block.size));
  };
  const updateDodge = (delta) => {
    const move = 390 * delta;
    if (keys.has("a")) dodge.player.x -= move;
    if (keys.has("d")) dodge.player.x += move;
    if (keys.has("w")) dodge.player.y -= move;
    if (keys.has("s")) dodge.player.y += move;
    dodge.player.x = clampValue(dodge.player.x, 0, width - dodge.player.size);
    dodge.player.y = clampValue(dodge.player.y, 0, height - dodge.player.size);
    dodge.elapsed += delta;
    dodge.spawnClock += delta;
    if (dodge.spawnClock > Math.max(0.14, 0.55 - dodge.elapsed * 0.01)) {
      dodge.spawnClock = 0;
      const size = 20 + Math.random() * 34;
      dodge.blocks.push({ x: Math.random() * (width - size), y: -size, size, speed: 150 + dodge.elapsed * 7 + Math.random() * 110 });
    }
    dodge.blocks.forEach((block) => (block.y += block.speed * delta));
    for (const block of dodge.blocks) {
      if (
        dodge.player.x < block.x + block.size &&
        dodge.player.x + dodge.player.size > block.x &&
        dodge.player.y < block.y + block.size &&
        dodge.player.y + dodge.player.size > block.y
      ) {
        finishGame(`坚持 ${dodge.score} 秒`);
        playBurstEffect(drawDodge, [{ x: dodge.player.x + dodge.player.size / 2, y: dodge.player.y + dodge.player.size / 2 }], {
          count: 18,
          distance: 62,
        });
        drawDodge();
        return;
      }
    }
    dodge.blocks = dodge.blocks.filter((block) => block.y < height + block.size);
    dodge.score = Math.floor(dodge.elapsed);
    scoreLabel.textContent = String(dodge.score);
    drawDodge();
  };
  const startDodge = () => {
    dodge.player = { x: 465, y: 455, size: 30 };
    dodge.blocks = [];
    dodge.score = 0;
    dodge.spawnClock = 0;
    dodge.elapsed = 0;
    scoreLabel.textContent = "0";
    drawDodge();
    startFrameLoop(updateDodge);
  };

  const tetrisShapes = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0, 0], [1, 1, 1]],
    [[0, 0, 1], [1, 1, 1]],
    [[0, 1, 1], [1, 1, 0]],
    [[1, 1, 0], [0, 1, 1]],
  ];
  const tetris = { columns: 10, rows: 18, board: [], piece: null, nextShape: null, score: 0 };
  const randomTetrisShape = () => tetrisShapes[Math.floor(Math.random() * tetrisShapes.length)].map((row) => [...row]);
  const rotatePiece = (shape) => shape[0].map((_, column) => shape.map((row) => row[column]).reverse());
  const tetrisCollision = (piece, offsetX = 0, offsetY = 0, shape = piece.shape) =>
    shape.some((row, y) =>
      row.some((value, x) => {
        if (!value) return false;
        const targetX = piece.x + x + offsetX;
        const targetY = piece.y + y + offsetY;
        return targetX < 0 || targetX >= tetris.columns || targetY >= tetris.rows || (targetY >= 0 && tetris.board[targetY][targetX]);
      }),
    );
  const spawnTetrisPiece = () => {
    const shape = tetris.nextShape || randomTetrisShape();
    tetris.nextShape = randomTetrisShape();
    tetris.piece = { shape, x: Math.floor((tetris.columns - shape[0].length) / 2), y: 0 };
    if (tetrisCollision(tetris.piece)) finishGame(`游戏结束，得分 ${tetris.score}`);
  };
  const drawTetris = () => {
    clearBoard();
    const colors = readColors();
    const size = 28;
    const left = (width - tetris.columns * size) / 2;
    const top = 18;
    context.strokeStyle = colors.grid;
    context.strokeRect(left - 2, top - 2, tetris.columns * size + 4, tetris.rows * size + 4);
    const drawBlock = (x, y, color) => {
      context.fillStyle = color;
      context.fillRect(left + x * size + 2, top + y * size + 2, size - 4, size - 4);
    };
    tetris.board.forEach((row, y) => row.forEach((value, x) => value && drawBlock(x, y, colors.primary)));
    tetris.piece?.shape.forEach((row, y) => row.forEach((value, x) => value && drawBlock(tetris.piece.x + x, tetris.piece.y + y, colors.bright)));
    const previewLeft = left + tetris.columns * size + 54;
    const previewTop = top + 44;
    context.fillStyle = colors.ink;
    context.font = "700 18px sans-serif";
    context.textAlign = "center";
    context.fillText("下一块", previewLeft + 58, previewTop - 14);
    context.strokeStyle = colors.grid;
    context.strokeRect(previewLeft, previewTop, 116, 116);
    const nextSize = 22;
    const nextWidth = (tetris.nextShape?.[0]?.length || 0) * nextSize;
    const nextHeight = (tetris.nextShape?.length || 0) * nextSize;
    tetris.nextShape?.forEach((row, y) =>
      row.forEach((value, x) => {
        if (!value) return;
        context.fillStyle = colors.primary;
        context.fillRect(
          previewLeft + (116 - nextWidth) / 2 + x * nextSize + 2,
          previewTop + (116 - nextHeight) / 2 + y * nextSize + 2,
          nextSize - 4,
          nextSize - 4,
        );
      }),
    );
    context.textAlign = "start";
  };
  const lockTetrisPiece = () => {
    tetris.piece.shape.forEach((row, y) =>
      row.forEach((value, x) => {
        if (value && tetris.piece.y + y >= 0) tetris.board[tetris.piece.y + y][tetris.piece.x + x] = 1;
      }),
    );
    const clearedRows = tetris.board
      .map((row, index) => (row.every(Boolean) ? index : -1))
      .filter((index) => index >= 0);
    const before = tetris.board.length;
    tetris.board = tetris.board.filter((row) => row.some((value) => !value));
    const cleared = before - tetris.board.length;
    while (tetris.board.length < tetris.rows) tetris.board.unshift(Array(tetris.columns).fill(0));
    if (cleared) {
      tetris.score += cleared * cleared * 100;
      scoreLabel.textContent = String(tetris.score);
      const size = 28;
      const left = (width - tetris.columns * size) / 2;
      const top = 18;
      playBurstEffect(
        drawTetris,
        clearedRows.map((row) => ({ x: left + (tetris.columns * size) / 2, y: top + row * size + size / 2 })),
        { count: 32, distance: 150, duration: 520, size: 11 },
      );
    }
    spawnTetrisPiece();
  };
  const stepTetris = () => {
    if (!tetris.piece) return;
    if (tetrisCollision(tetris.piece, 0, 1)) lockTetrisPiece();
    else tetris.piece.y += 1;
    drawTetris();
  };
  const startTetris = () => {
    tetris.board = Array.from({ length: tetris.rows }, () => Array(tetris.columns).fill(0));
    tetris.score = 0;
    tetris.nextShape = randomTetrisShape();
    scoreLabel.textContent = "0";
    spawnTetrisPiece();
    drawTetris();
    if (active) intervalId = window.setInterval(stepTetris, 520);
  };

  const pacman = {
    columns: 21,
    rows: 11,
    walls: [],
    dots: new Set(),
    player: { x: 1, y: 1 },
    direction: { x: 1, y: 0 },
    queued: { x: 1, y: 0 },
    ghosts: [],
    score: 0,
    moveClock: 0,
    ghostClock: 0,
    previousPlayer: { x: 1, y: 1 },
  };
  const buildPacmanMaze = () => {
    pacman.walls = Array.from({ length: pacman.rows }, (_, y) =>
      Array.from({ length: pacman.columns }, (_, x) => {
        if (x === 0 || y === 0 || x === pacman.columns - 1 || y === pacman.rows - 1) return 1;
        if (x % 4 === 0 && y % 3 !== 1) return 1;
        if (y === 5 && x % 5 !== 2) return 1;
        return 0;
      }),
    );
    [[1, 1], [19, 9], [10, 3], [10, 7]].forEach(([x, y]) => (pacman.walls[y][x] = 0));
    pacman.dots = new Set();
    for (let y = 1; y < pacman.rows - 1; y += 1) {
      for (let x = 1; x < pacman.columns - 1; x += 1) {
        if (!pacman.walls[y][x]) pacman.dots.add(`${x},${y}`);
      }
    }
  };
  const drawPacman = (time = performance.now()) => {
    clearBoard();
    const colors = readColors();
    const size = 40;
    const left = (width - pacman.columns * size) / 2;
    const top = (height - pacman.rows * size) / 2;
    pacman.walls.forEach((row, y) =>
      row.forEach((wall, x) => {
        if (!wall) return;
        context.fillStyle = colors.primary;
        context.fillRect(left + x * size + 3, top + y * size + 3, size - 6, size - 6);
      }),
    );
    context.fillStyle = colors.bright;
    pacman.dots.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      context.beginPath();
      context.arc(left + x * size + size / 2, top + y * size + size / 2, 4, 0, Math.PI * 2);
      context.fill();
    });
    const movementProgress = Math.min(1, pacman.moveClock / 0.18);
    const playerX = pacman.previousPlayer.x + (pacman.player.x - pacman.previousPlayer.x) * movementProgress;
    const playerY = pacman.previousPlayer.y + (pacman.player.y - pacman.previousPlayer.y) * movementProgress;
    const angle = Math.atan2(pacman.direction.y, pacman.direction.x);
    const mouth = 0.16 + Math.abs(Math.sin(time / 75)) * 0.32;
    context.save();
    context.translate(left + playerX * size + size / 2, top + playerY * size + size / 2);
    context.rotate(angle);
    context.fillStyle = "#ffd84d";
    context.beginPath();
    context.arc(0, 0, 14, mouth, Math.PI * 2 - mouth);
    context.lineTo(0, 0);
    context.fill();
    context.restore();
    context.fillStyle = colors.food;
    pacman.ghosts.forEach((ghost) => {
      const ghostProgress = Math.min(1, pacman.ghostClock / 0.34);
      const ghostX = (ghost.previous?.x ?? ghost.x) + (ghost.x - (ghost.previous?.x ?? ghost.x)) * ghostProgress;
      const ghostY = (ghost.previous?.y ?? ghost.y) + (ghost.y - (ghost.previous?.y ?? ghost.y)) * ghostProgress;
      context.beginPath();
      context.arc(left + ghostX * size + size / 2, top + ghostY * size + size / 2, 14, Math.PI, 0);
      context.lineTo(left + ghostX * size + size - 6, top + ghostY * size + size - 7);
      context.lineTo(left + ghostX * size + 6, top + ghostY * size + size - 7);
      context.closePath();
      context.fill();
    });
  };
  const pacmanCanMove = (point, direction) => {
    const x = point.x + direction.x;
    const y = point.y + direction.y;
    return x >= 0 && y >= 0 && x < pacman.columns && y < pacman.rows && !pacman.walls[y][x];
  };
  const stepPacmanPlayer = () => {
    pacman.previousPlayer = { ...pacman.player };
    if (pacmanCanMove(pacman.player, pacman.queued)) pacman.direction = pacman.queued;
    if (pacmanCanMove(pacman.player, pacman.direction)) {
      pacman.player.x += pacman.direction.x;
      pacman.player.y += pacman.direction.y;
    }
    const key = `${pacman.player.x},${pacman.player.y}`;
    if (pacman.dots.delete(key)) {
      pacman.score += 1;
      scoreLabel.textContent = String(pacman.score);
      const size = 40;
      const left = (width - pacman.columns * size) / 2;
      const top = (height - pacman.rows * size) / 2;
      playBurstEffect(
        drawPacman,
        [{ x: left + pacman.player.x * size + size / 2, y: top + pacman.player.y * size + size / 2, color: "#ffd84d" }],
        { count: 6, distance: 18, duration: 190, size: 5 },
      );
    }
  };
  const stepPacmanGhosts = () => {
    const directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
    pacman.ghosts.forEach((ghost) => {
      ghost.previous = { x: ghost.x, y: ghost.y };
      const options = directions
        .filter((direction) => pacmanCanMove(ghost, direction))
        .sort(
          (a, b) =>
            Math.abs(ghost.x + a.x - pacman.player.x) + Math.abs(ghost.y + a.y - pacman.player.y) -
            (Math.abs(ghost.x + b.x - pacman.player.x) + Math.abs(ghost.y + b.y - pacman.player.y)),
        );
      const move = Math.random() < 0.78 ? options[0] : options[Math.floor(Math.random() * options.length)];
      if (move) {
        ghost.x += move.x;
        ghost.y += move.y;
      }
    });
  };
  const pacmanWasCaught = () => {
    const playerProgress = Math.min(1, pacman.moveClock / 0.18);
    const playerX = pacman.previousPlayer.x + (pacman.player.x - pacman.previousPlayer.x) * playerProgress;
    const playerY = pacman.previousPlayer.y + (pacman.player.y - pacman.previousPlayer.y) * playerProgress;
    return pacman.ghosts.some((ghost) => {
      const ghostProgress = Math.min(1, pacman.ghostClock / 0.34);
      const ghostX = (ghost.previous?.x ?? ghost.x) + (ghost.x - (ghost.previous?.x ?? ghost.x)) * ghostProgress;
      const ghostY = (ghost.previous?.y ?? ghost.y) + (ghost.y - (ghost.previous?.y ?? ghost.y)) * ghostProgress;
      const distance = Math.hypot(playerX - ghostX, playerY - ghostY);
      const crossed =
        ghost.previous?.x === pacman.player.x &&
        ghost.previous?.y === pacman.player.y &&
        ghost.x === pacman.previousPlayer.x &&
        ghost.y === pacman.previousPlayer.y;
      return distance < 0.62 || crossed;
    });
  };
  const updatePacman = (delta) => {
    pacman.moveClock += delta;
    pacman.ghostClock += delta;
    if (pacman.moveClock >= 0.18) {
      pacman.moveClock %= 0.18;
      stepPacmanPlayer();
    }
    if (pacman.ghostClock >= 0.34) {
      pacman.ghostClock %= 0.34;
      stepPacmanGhosts();
    }
    if (pacmanWasCaught()) {
      finishGame(`被抓住了，得分 ${pacman.score}`);
      const size = 40;
      const left = (width - pacman.columns * size) / 2;
      const top = (height - pacman.rows * size) / 2;
      playBurstEffect(
        drawPacman,
        [{ x: left + pacman.player.x * size + size / 2, y: top + pacman.player.y * size + size / 2, color: "#ffd84d" }],
        { count: 18, distance: 70 },
      );
      return;
    }
    if (!pacman.dots.size) {
      finishGame(`迷宫清空，得分 ${pacman.score}`);
      return;
    }
    drawPacman();
  };
  const startPacman = () => {
    buildPacmanMaze();
    pacman.player = { x: 1, y: 1 };
    pacman.direction = { x: 1, y: 0 };
    pacman.queued = { x: 1, y: 0 };
    pacman.previousPlayer = { x: 1, y: 1 };
    pacman.moveClock = 0;
    pacman.ghostClock = 0;
    pacman.ghosts = [
      { x: 19, y: 9, previous: { x: 19, y: 9 } },
      { x: 10, y: 3, previous: { x: 10, y: 3 } },
      { x: 10, y: 7, previous: { x: 10, y: 7 } },
    ];
    pacman.score = 0;
    scoreLabel.textContent = "0";
    drawPacman();
    if (active) startFrameLoop(updatePacman);
  };

  const match3 = { columns: 8, rows: 8, board: [], selected: null, score: 0, colors: 6, animating: false };
  const buildMatch3 = () => {
    match3.board = Array.from({ length: match3.rows }, () =>
      Array.from({ length: match3.columns }, () => Math.floor(Math.random() * match3.colors)),
    );
  };
  const drawMatch3 = (animation = null) => {
    clearBoard();
    const palette = pokemonTileColors;
    const size = 58;
    const left = (width - match3.columns * size) / 2;
    const top = (height - match3.rows * size) / 2;
    const drawTile = (value, x, y, scale = 1) => {
      if (value < 0) return;
      const tileSize = (size - 10) * scale;
      const tileLeft = left + x * size + (size - tileSize) / 2;
      const tileTop = top + y * size + (size - tileSize) / 2;
      context.fillStyle = "rgba(5,10,15,.82)";
      context.fillRect(tileLeft, tileTop, tileSize, tileSize);
      context.strokeStyle = palette[value];
      context.lineWidth = 3;
      context.strokeRect(tileLeft + 1.5, tileTop + 1.5, tileSize - 3, tileSize - 3);
      drawTilePattern(value, tileLeft + tileSize / 2, tileTop + tileSize / 2, tileSize * 0.41);
    };
    match3.board.forEach((row, y) =>
      row.forEach((value, x) => {
        const isSwapping =
          animation?.type === "swap" &&
          ((animation.a.x === x && animation.a.y === y) || (animation.b.x === x && animation.b.y === y));
        const isShattering = animation?.type === "shatter" && animation.matches.has(`${x},${y}`);
        if (!isSwapping && !isShattering) drawTile(value, x, y);
        if (match3.selected?.x === x && match3.selected?.y === y) {
          context.strokeStyle = "#ffffff";
          context.lineWidth = 4;
          context.strokeRect(left + x * size + 2, top + y * size + 2, size - 4, size - 4);
        }
      }),
    );
    if (animation?.type === "swap") {
      const ease = animation.progress * animation.progress * (3 - 2 * animation.progress);
      const ax = animation.a.x + (animation.b.x - animation.a.x) * ease;
      const ay = animation.a.y + (animation.b.y - animation.a.y) * ease;
      const bx = animation.b.x + (animation.a.x - animation.b.x) * ease;
      const by = animation.b.y + (animation.a.y - animation.b.y) * ease;
      drawTile(match3.board[animation.a.y][animation.a.x], ax, ay);
      drawTile(match3.board[animation.b.y][animation.b.x], bx, by);
    } else if (animation?.type === "shatter") {
      animation.matches.forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        const value = match3.board[y][x];
        const centerX = left + x * size + size / 2;
        const centerY = top + y * size + size / 2;
        const fragment = (size - 12) / 2;
        const spread = animation.progress * 24;
        context.globalAlpha = 1 - animation.progress;
        context.fillStyle = palette[value];
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => {
          context.save();
          context.translate(centerX + dx * spread, centerY + dy * spread);
          context.rotate(dx * dy * animation.progress * 0.8);
          context.fillRect(-fragment / 2, -fragment / 2, fragment, fragment);
          context.restore();
        });
        context.globalAlpha = 1;
      });
      animation.specials?.forEach((point) => {
        const centerX = left + point.x * size + size / 2;
        const centerY = top + point.y * size + size / 2;
        context.save();
        context.globalAlpha = 1 - animation.progress;
        context.strokeStyle = "#ffffff";
        context.lineWidth = 5 * (1 - animation.progress) + 1;
        context.beginPath();
        context.arc(centerX, centerY, 12 + animation.progress * size * 1.55, 0, Math.PI * 2);
        context.stroke();
        context.strokeStyle = "#ffd84d";
        context.beginPath();
        context.arc(centerX, centerY, 6 + animation.progress * size, 0, Math.PI * 2);
        context.stroke();
        context.restore();
      });
    }
  };
  const findMatch3Groups = () => {
    const groups = [];
    for (let y = 0; y < match3.rows; y += 1) {
      let x = 0;
      while (x < match3.columns) {
        const value = match3.board[y][x];
        let end = x + 1;
        while (end < match3.columns && match3.board[y][end] === value) end += 1;
        if (value >= 0 && end - x >= 3) groups.push(Array.from({ length: end - x }, (_, index) => ({ x: x + index, y })));
        x = end;
      }
    }
    for (let x = 0; x < match3.columns; x += 1) {
      let y = 0;
      while (y < match3.rows) {
        const value = match3.board[y][x];
        let end = y + 1;
        while (end < match3.rows && match3.board[end][x] === value) end += 1;
        if (value >= 0 && end - y >= 3) groups.push(Array.from({ length: end - y }, (_, index) => ({ x, y: y + index })));
        y = end;
      }
    }
    return groups;
  };
  const findMatch3 = () => new Set(findMatch3Groups().flat().map((point) => `${point.x},${point.y}`));
  const animateMatch3Swap = (a, b) => animateVisual(190, (progress) => drawMatch3({ type: "swap", a, b, progress }));
  const settleMatch3 = async (animate = true) => {
    let groups = findMatch3Groups();
    let matches = new Set(groups.flat().map((point) => `${point.x},${point.y}`));
    while (matches.size) {
      const specials = groups.filter((group) => group.length >= 4).map((group) => group[Math.floor(group.length / 2)]);
      specials.forEach((point) => {
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            const x = point.x + offsetX;
            const y = point.y + offsetY;
            if (x >= 0 && y >= 0 && x < match3.columns && y < match3.rows) matches.add(`${x},${y}`);
          }
        }
      });
      if (animate) await animateVisual(360, (progress) => drawMatch3({ type: "shatter", matches, specials, progress }));
      matches.forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        match3.board[y][x] = -1;
      });
      match3.score += matches.size * 10 + specials.length * 120;
      for (let x = 0; x < match3.columns; x += 1) {
        const values = [];
        for (let y = match3.rows - 1; y >= 0; y -= 1) if (match3.board[y][x] >= 0) values.push(match3.board[y][x]);
        for (let y = match3.rows - 1, index = 0; y >= 0; y -= 1, index += 1) {
          match3.board[y][x] = index < values.length ? values[index] : Math.floor(Math.random() * match3.colors);
        }
      }
      groups = findMatch3Groups();
      matches = new Set(groups.flat().map((point) => `${point.x},${point.y}`));
      drawMatch3();
    }
    scoreLabel.textContent = String(match3.score);
    drawMatch3();
  };
  const startMatch3 = () => {
    match3.score = 0;
    match3.selected = null;
    match3.animating = false;
    buildMatch3();
    settleMatch3(false);
  };

  const linkGame = { columns: 10, rows: 6, board: [], selected: null, score: 0, path: null, lineTimer: 0 };
  const buildLinkGame = () => {
    const values = [];
    for (let index = 0; index < (linkGame.columns * linkGame.rows) / 2; index += 1) values.push(index % 12, index % 12);
    values.sort(() => Math.random() - 0.5);
    linkGame.board = Array.from({ length: linkGame.rows }, (_, y) =>
      Array.from({ length: linkGame.columns }, (_, x) => values[y * linkGame.columns + x]),
    );
  };
  const drawLinkGame = () => {
    clearBoard();
    const palette = pokemonTileColors;
    const size = 66;
    const left = (width - linkGame.columns * size) / 2;
    const top = (height - linkGame.rows * size) / 2;
    linkGame.board.forEach((row, y) =>
      row.forEach((value, x) => {
        if (value < 0) return;
        context.fillStyle = "rgba(5,10,15,.82)";
        context.fillRect(left + x * size + 5, top + y * size + 5, size - 10, size - 10);
        context.strokeStyle = palette[value];
        context.lineWidth = 3;
        context.strokeRect(left + x * size + 6.5, top + y * size + 6.5, size - 13, size - 13);
        drawTilePattern(value, left + x * size + size / 2, top + y * size + size / 2, 25);
        if (linkGame.selected?.x === x && linkGame.selected?.y === y) {
          context.strokeStyle = "#ffffff";
          context.lineWidth = 4;
          context.strokeRect(left + x * size + 2, top + y * size + 2, size - 4, size - 4);
        }
      }),
    );
    if (linkGame.path?.length) {
      context.strokeStyle = "#ffffff";
      context.lineWidth = 5;
      context.lineJoin = "round";
      context.lineCap = "round";
      context.shadowColor = "rgba(255,255,255,.55)";
      context.shadowBlur = 10;
      context.beginPath();
      linkGame.path.forEach((point, index) => {
        const px = left + point.x * size + size / 2;
        const py = top + point.y * size + size / 2;
        if (index === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      });
      context.stroke();
      context.shadowBlur = 0;
    }
    context.textAlign = "start";
  };
  const canLinkTiles = (start, target) => {
    const minX = -1;
    const maxX = linkGame.columns;
    const minY = -1;
    const maxY = linkGame.rows;
    const directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
    const queue = directions.map((direction, index) => ({
      x: start.x,
      y: start.y,
      direction,
      directionIndex: index,
      turns: 0,
      path: [start],
    }));
    const seen = new Map();
    while (queue.length) {
      const state = queue.shift();
      const nextX = state.x + state.direction.x;
      const nextY = state.y + state.direction.y;
      if (nextX < minX || nextX > maxX || nextY < minY || nextY > maxY) continue;
      const isTarget = nextX === target.x && nextY === target.y;
      const inside = nextX >= 0 && nextX < linkGame.columns && nextY >= 0 && nextY < linkGame.rows;
      if (inside && !isTarget && linkGame.board[nextY][nextX] >= 0) continue;
      const nextPath = [...state.path, { x: nextX, y: nextY }];
      if (isTarget) return nextPath;
      const key = `${nextX},${nextY},${state.directionIndex}`;
      if ((seen.get(key) ?? 3) <= state.turns) continue;
      seen.set(key, state.turns);
      directions.forEach((direction, index) => {
        const turns = state.turns + (index === state.directionIndex ? 0 : 1);
        if (turns <= 2) queue.push({ x: nextX, y: nextY, direction, directionIndex: index, turns, path: nextPath });
      });
    }
    return null;
  };
  const startLinkGame = () => {
    linkGame.score = 0;
    linkGame.selected = null;
    linkGame.path = null;
    window.clearTimeout(linkGame.lineTimer);
    scoreLabel.textContent = "0";
    buildLinkGame();
    drawLinkGame();
  };

  const gameInfo = {
    snake: { title: "贪吃蛇", score: "得分", status: "点击开始后，使用 W A S D 控制方向", start: startSnake, draw: drawSnake },
    pong: { title: "经典乒乓", score: "比分", status: "点击开始后，使用 W / S 控制左侧球拍", start: startPong, draw: drawPong },
    breakout: { title: "打砖块", score: "得分", status: "点击开始后，使用 A / D 控制挡板", start: startBreakout, draw: drawBreakout },
    shooter: { title: "打飞机", score: "得分", status: "使用 W / S 上下移动，战机会向右自动射击", start: startShooter, draw: drawShooter },
    tetris: { title: "俄罗斯方块", score: "得分", status: "使用 W 旋转，A / D 移动，S 加速下落，J 切换下一块", start: startTetris, draw: drawTetris },
    dodge: { title: "躲避方块", score: "秒数", status: "使用 W A S D 移动并尽可能坚持", start: startDodge, draw: drawDodge },
    pacman: { title: "吃豆人", score: "得分", status: "使用 W A S D 穿过迷宫并吃完豆子", start: startPacman, draw: drawPacman },
    match3: { title: "消消乐", score: "得分", status: "点击两个相邻方块交换，组成三个或更多同色方块", start: startMatch3, draw: drawMatch3 },
    link: { title: "连连看", score: "消除", status: "点击两个相同方块，连接路径最多允许两次转弯", start: startLinkGame, draw: drawLinkGame },
  };
  const previewGame = () => {
    const info = gameInfo[currentGame];
    gameTitle.textContent = info.title;
    scoreName.textContent = info.score;
    scoreLabel.textContent = currentGame === "pong" ? "0 : 0" : "0";
    status.textContent = info.status;
    startButton.textContent = "开始游戏";
    modeRoot.hidden = currentGame !== "snake";
    if (currentGame === "snake") {
      snake.body = [{ x: 16, y: 9 }, { x: 15, y: 9 }, { x: 14, y: 9 }];
      snake.foods = [{ x: 23, y: 9 }];
    } else if (currentGame === "pong") {
      pong.playerY = 220;
      pong.aiY = 220;
      resetPongBall(1);
    } else if (currentGame === "breakout") {
      buildBricks();
      resetBreakoutBall();
    } else if (currentGame === "shooter") {
      shooter.player = { x: 80, y: 270 };
      shooter.bullets = [];
      shooter.enemies = [];
    } else if (currentGame === "tetris") {
      tetris.board = Array.from({ length: tetris.rows }, () => Array(tetris.columns).fill(0));
      tetris.piece = { shape: tetrisShapes[2].map((row) => [...row]), x: 4, y: 2 };
      tetris.nextShape = tetrisShapes[5].map((row) => [...row]);
    } else if (currentGame === "dodge") {
      dodge.player = { x: 465, y: 455, size: 30 };
      dodge.blocks = [];
    } else if (currentGame === "pacman") {
      buildPacmanMaze();
      pacman.player = { x: 1, y: 1 };
      pacman.previousPlayer = { x: 1, y: 1 };
      pacman.ghosts = [
        { x: 19, y: 9, previous: { x: 19, y: 9 } },
        { x: 10, y: 3, previous: { x: 10, y: 3 } },
        { x: 10, y: 7, previous: { x: 10, y: 7 } },
      ];
    } else if (currentGame === "match3") {
      buildMatch3();
      match3.selected = null;
      match3.animating = false;
    } else if (currentGame === "link") {
      buildLinkGame();
      linkGame.selected = null;
      linkGame.path = null;
      window.clearTimeout(linkGame.lineTimer);
    }
    info.draw();
  };
  const startCurrentGame = () => {
    stopGame();
    active = true;
    startButton.textContent = "重新开始";
    status.textContent = gameInfo[currentGame].status;
    canvas.focus({ preventScroll: true });
    gameInfo[currentGame].start();
  };

  gameSelect.addEventListener("change", () => {
    stopGame();
    currentGame = gameSelect.value;
    previewGame();
  });
  startButton.addEventListener("click", startCurrentGame);
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      snakeMode = button.dataset.snakeMode === "buffet" ? "buffet" : "classic";
      modeButtons.forEach((item) => {
        item.dataset.active = String(item === button);
      });
      status.textContent = snakeMode === "buffet" ? "自助餐：持续加速刷新食物并支持穿墙" : "经典：吃掉食物后刷新下一颗";
      if (active && currentGame === "snake") startCurrentGame();
    });
  });
  canvas.addEventListener("click", async (event) => {
    canvas.focus({ preventScroll: true });
    if (!active || !["match3", "link"].includes(currentGame)) return;
    const rect = canvas.getBoundingClientRect();
    const canvasX = ((event.clientX - rect.left) / rect.width) * width;
    const canvasY = ((event.clientY - rect.top) / rect.height) * height;
    if (currentGame === "match3") {
      const size = 58;
      const left = (width - match3.columns * size) / 2;
      const top = (height - match3.rows * size) / 2;
      const x = Math.floor((canvasX - left) / size);
      const y = Math.floor((canvasY - top) / size);
      if (match3.animating || x < 0 || y < 0 || x >= match3.columns || y >= match3.rows) return;
      if (!match3.selected) {
        match3.selected = { x, y };
      } else {
        const selected = match3.selected;
        const adjacent = Math.abs(selected.x - x) + Math.abs(selected.y - y) === 1;
        match3.selected = null;
        if (adjacent) {
          match3.animating = true;
          await animateMatch3Swap(selected, { x, y });
          [match3.board[selected.y][selected.x], match3.board[y][x]] = [match3.board[y][x], match3.board[selected.y][selected.x]];
          if (findMatch3().size) {
            await settleMatch3(true);
            match3.animating = false;
            return;
          }
          await animateMatch3Swap(selected, { x, y });
          [match3.board[selected.y][selected.x], match3.board[y][x]] = [match3.board[y][x], match3.board[selected.y][selected.x]];
          match3.animating = false;
        }
      }
      drawMatch3();
    } else {
      const size = 66;
      const left = (width - linkGame.columns * size) / 2;
      const top = (height - linkGame.rows * size) / 2;
      const x = Math.floor((canvasX - left) / size);
      const y = Math.floor((canvasY - top) / size);
      if (x < 0 || y < 0 || x >= linkGame.columns || y >= linkGame.rows || linkGame.board[y][x] < 0) return;
      if (!linkGame.selected) {
        linkGame.selected = { x, y };
      } else {
        const selected = linkGame.selected;
        const sameTile = selected.x === x && selected.y === y;
        const sameValue = linkGame.board[selected.y][selected.x] === linkGame.board[y][x];
        const path = !sameTile && sameValue ? canLinkTiles(selected, { x, y }) : null;
        if (path) {
          const size = 66;
          const left = (width - linkGame.columns * size) / 2;
          const top = (height - linkGame.rows * size) / 2;
          linkGame.board[selected.y][selected.x] = -1;
          linkGame.board[y][x] = -1;
          linkGame.path = path;
          linkGame.score += 2;
          scoreLabel.textContent = String(linkGame.score);
          if (linkGame.board.every((row) => row.every((value) => value < 0))) finishGame("全部消除完成");
          playBurstEffect(
            drawLinkGame,
            [
              { x: left + selected.x * size + size / 2, y: top + selected.y * size + size / 2 },
              { x: left + x * size + size / 2, y: top + y * size + size / 2 },
            ],
            { count: 9, distance: 34, duration: 300 },
          );
          window.clearTimeout(linkGame.lineTimer);
          linkGame.lineTimer = window.setTimeout(() => {
            linkGame.path = null;
            if (currentGame === "link") drawLinkGame();
          }, 420);
        }
        linkGame.selected = null;
      }
      drawLinkGame();
    }
  });
  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (!active || !["w", "a", "s", "d", "j"].includes(key)) return;
    event.preventDefault();
    keys.add(key);
    if (currentGame === "snake") {
      const directions = { w: { x: 0, y: -1 }, a: { x: -1, y: 0 }, s: { x: 0, y: 1 }, d: { x: 1, y: 0 } };
      const next = directions[key];
      if (next.x !== -snake.direction.x || next.y !== -snake.direction.y) snake.queued = next;
    } else if (currentGame === "pacman") {
      pacman.queued = { w: { x: 0, y: -1 }, a: { x: -1, y: 0 }, s: { x: 0, y: 1 }, d: { x: 1, y: 0 } }[key];
    } else if (currentGame === "tetris" && tetris.piece) {
      if (key === "a" && !tetrisCollision(tetris.piece, -1, 0)) tetris.piece.x -= 1;
      if (key === "d" && !tetrisCollision(tetris.piece, 1, 0)) tetris.piece.x += 1;
      if (key === "s") stepTetris();
      if (key === "w") {
        const rotated = rotatePiece(tetris.piece.shape);
        if (!tetrisCollision(tetris.piece, 0, 0, rotated)) tetris.piece.shape = rotated;
      }
      if (key === "j" && tetris.nextShape) {
        const previousShape = tetris.piece.shape;
        const nextPiece = {
          shape: tetris.nextShape,
          x: clampValue(tetris.piece.x, 0, tetris.columns - tetris.nextShape[0].length),
          y: tetris.piece.y,
        };
        if (!tetrisCollision(nextPiece)) {
          tetris.piece = nextPiece;
          tetris.nextShape = previousShape;
        }
      }
      drawTetris();
    }
  });
  document.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
  previewGame();
};

setupMiniGames();





