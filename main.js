const content = window.PORTFOLIO_CONTENT;
const manifest = window.PORTFOLIO_MANIFEST || {};
const hasManifestItems = (items) => Array.isArray(items) && items.length > 0;
const portfolioData = {
  profile: manifest.profile || {},
  levelProjects: hasManifestItems(manifest.levelProjects) ? manifest.levelProjects : content.levelProjects,
  modelingWorks: hasManifestItems(manifest.modelingWorks) ? manifest.modelingWorks : content.modelingWorks,
  blueprints: hasManifestItems(manifest.blueprints) ? manifest.blueprints : content.gameProject.blueprints,
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
};

const tabTitleSuffix = "ciallo～(∠・ω< )⌒☆";
const updateTabTitle = () => {
  document.title = `${profileData.nickname} ${tabTitleSuffix}`;
};
const updateFavicon = (href = profileData.avatar) => {
  let favicon = document.querySelector('link[rel~="icon"]');
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.append(favicon);
  }
  favicon.type = "image/jpeg";
  favicon.href = href;
};

updateTabTitle();
updateFavicon(profileData.avatar);

const headerContact = document.querySelector("[data-header-contact]");

const renderHeaderContact = (avatar = profileData.avatar) => {
  const phoneHref = profileData.phone ? `tel:${profileData.phone.replace(/[^\d+]/g, "")}` : "";
  const emailHref = profileData.email ? `mailto:${profileData.email}` : "";
  const headerItems = [
    { label: profileData.nickname },
    profileData.phone ? { label: profileData.phone, href: phoneHref } : null,
    profileData.email ? { label: profileData.email, href: emailHref } : null,
  ].filter(Boolean);

  headerContact.innerHTML = `
    <img class="header-avatar" src="${avatar}" alt="" loading="lazy">
    ${headerItems
      .map((item) => {
        const tag = item.href ? "a" : "span";
        const href = item.href ? ` href="${item.href}"` : "";
        return `<${tag} class="header-contact-item"${href}>${item.label}</${tag}>`;
      })
      .join("")}
  `;
  const avatarImage = headerContact.querySelector(".header-avatar");
  avatarImage.onerror = () => {
    if (avatarImage.getAttribute("src") !== profileData.avatar) {
      avatarImage.src = profileData.avatar;
    }
  };
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
modelingGrid.innerHTML = `
  <article class="modeling-carousel" data-modeling-carousel>
    <button class="carousel-arrow is-prev" type="button" aria-label="上一张">‹</button>
    <div class="modeling-viewport">
      <div class="modeling-track" data-modeling-track>
        ${portfolioData.modelingWorks.map((work) => createImageCard(work, true).outerHTML).join("")}
      </div>
    </div>
    <div class="carousel-dots" data-carousel-dots aria-label="建模作品页码"></div>
    <button class="carousel-arrow is-next" type="button" aria-label="下一张">›</button>
  </article>
`;

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
  const render = () => {
    track.style.transform = `translateX(${-index * 100}%)`;
    slides.forEach((slide, slideIndex) => {
      slide.dataset.active = String(slideIndex === index || (index === realSlides.length && slideIndex === 0));
    });
    dots.forEach((dot, dotIndex) => {
      dot.dataset.active = String((index === realSlides.length ? 0 : index) === dotIndex);
    });
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
  const maxX = Math.max(...graph.nodes.map((node) => node.x + node.width)) + 120;
  const maxY = Math.max(...graph.nodes.map((node) => node.y)) + 240;
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

  const state = { x: -28, y: -42, scale: 0.3, drag: null };
  stage._blueprintState = state;

  const applyTransform = (nextState = stage._blueprintState) => {
    canvas.style.transform = `translate(${nextState.x}px, ${nextState.y}px) scale(${nextState.scale})`;
    stage.style.setProperty("--blueprint-scale", nextState.scale.toFixed(2));
  };

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

  document.querySelector("[data-blueprint-reset]")?.addEventListener("click", () => {
    const viewerState = stage._blueprintState;
    viewerState.x = -28;
    viewerState.y = -42;
    viewerState.scale = 0.3;
    applyTransform(viewerState);
  });

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

const renderExternalModule = (selector, data, options = {}) => {
  const root = document.querySelector(selector);
  root._externalOptions = options;
  root._externalData = data;
  root.dataset.fitReady = "false";
  const fallbackImage = data.fallbackImage || data.image;
  root.innerHTML = `
    <div class="external-image" role="img" aria-label="${data.title}">
      <img src="${data.image}" alt="${data.title}" loading="lazy">
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
  const externalImage = root.querySelector(".external-image img");
  externalImage.onerror = () => {
    if (fallbackImage && externalImage.getAttribute("src") !== fallbackImage) {
      externalImage.src = fallbackImage;
    }
  };
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
    }, 9000);
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
      return { payload, method: "fetch" };
    }
  } catch {
    // Some browsers or deployments may block Bilibili CORS; JSONP is the static-site fallback.
  }
  const payload = await requestJsonp(url);
  return { payload, method: "jsonp" };
};

const requestBilibiliView = async (bvid) => {
  const url = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`;
  try {
    const response = await fetch(url, { mode: "cors" });
    if (response.ok) {
      const payload = await response.json();
      return { payload, method: "view-fetch" };
    }
  } catch {
    // JSONP fallback below keeps this working as a plain static page.
  }
  const payload = await requestJsonp(url);
  return { payload, method: "view-jsonp" };
};

const requestBilibiliUserInfo = async (vmid) => {
  const url = `https://api.bilibili.com/x/space/acc/info?mid=${encodeURIComponent(vmid)}`;
  try {
    const response = await fetch(url, { mode: "cors" });
    if (response.ok) {
      const payload = await response.json();
      return { payload, method: "user-fetch" };
    }
  } catch {
    // JSONP fallback below.
  }
  const payload = await requestJsonp(url);
  return { payload, method: "user-jsonp" };
};

const updateHeaderAvatarFromBilibili = async () => {
  if (!profileData.bilibiliVmid) return;
  try {
    const { payload } = await requestBilibiliUserInfo(profileData.bilibiliVmid);
    const avatar = normalizeBilibiliImage(payload?.data?.face || "");
    if (avatar && (await imageExists(avatar))) {
      renderHeaderContact(avatar);
      updateFavicon(avatar);
    }
  } catch {
    // Keep the local fallback avatar from the maintenance entry.
  }
};

const updateBilibiliModuleFromApi = async () => {
  const data = {
    ...content.bilibiliModule,
    vmid: profileData.bilibiliVmid || content.bilibiliModule.vmid,
    homepage: profileData.bilibiliHomepage || content.bilibiliModule.homepage,
  };
  const root = document.querySelector("[data-bilibili-module]");
  const vmid = data.vmid || "74399560";
  try {
    root.dataset.biliStatus = "loading";
    const fallbackBvid = extractBvid(data.url);
    let method = "";
    let response = null;
    try {
      const topArc = await requestBilibiliTopArc(vmid);
      response = topArc.payload;
      method = topArc.method;
    } catch {
      if (!fallbackBvid) throw new Error("Missing Bilibili BV id");
      const view = await requestBilibiliView(fallbackBvid);
      response = view.payload;
      method = view.method;
    }
    const video = response?.data;
    if (!video?.bvid && !video?.aid) {
      root.dataset.biliStatus = "fallback-empty";
      return;
    }
    const dynamicImage = normalizeBilibiliImage(video.pic || "");
    const usableDynamicImage = dynamicImage && (await imageExists(dynamicImage)) ? dynamicImage : data.image;
    const dynamicData = {
      ...data,
      title: video.title || data.title,
      owner: video.owner?.name || data.owner,
      url: video.bvid ? `https://www.bilibili.com/video/${video.bvid}` : data.url,
      image: usableDynamicImage,
      fallbackImage: data.image,
      stats: [
        `播放 ${formatCount(video.stat?.view ?? video.stat?.vv)}`,
        `点赞 ${formatCount(video.stat?.like)}`,
        `收藏 ${formatCount(video.stat?.favorite)}`,
        `评论 ${formatCount(video.stat?.reply)}`,
      ],
      text: video.desc || data.text,
      source: "",
    };
    const ownerAvatar = normalizeBilibiliImage(video.owner?.face || "");
    if (ownerAvatar && (await imageExists(ownerAvatar))) {
      renderHeaderContact(ownerAvatar);
      updateFavicon(ownerAvatar);
    }
    renderExternalModule("[data-bilibili-module]", dynamicData, root?._externalOptions || { kicker: "Bilibili" });
    document.querySelector("[data-bilibili-module]").dataset.biliStatus = method;
    syncExternalModuleHeights();
  } catch {
    root.dataset.biliStatus = "fallback-error";
    // Keep the local fallback content when Bilibili blocks or rate-limits the request.
  }
};

const fitExternalCard = (root) => {
  const imageBox = root.querySelector(".external-image");
  const body = root.querySelector(".external-body");
  if (!imageBox || !body) return;

  const apply = () => {
    if (window.matchMedia("(max-width: 720px)").matches) {
      root.style.removeProperty("--external-box-height");
      body.style.setProperty("--external-text-scale", "1");
      root.dataset.fitReady = "true";
      return;
    }
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
      } else {
        root.dataset.fitReady = "true";
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

renderExternalModule("[data-fanqie-module]", content.fanqieModule, {
  kicker: "Fanqie Novel",
});

syncExternalModuleHeights();
window.addEventListener("resize", syncExternalModuleHeights);
updateHeaderAvatarFromBilibili();
updateBilibiliModuleFromApi();
