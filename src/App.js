import React, { useState, useEffect, useMemo, Fragment, useRef } from 'react';
import './App.css';
import winesData from './data/wines-2024.json';

// Helper to build Imgix URL with defaults
const buildImgixUrl = (url, params = {}) => {
    if (!url) return url;
    try {
        const u = new URL(url, window.location.origin);
        // Only apply if URL likely goes through Imgix
        if (!u.hostname.includes('imgix')) {
            return url; // no-op for non-Imgix hosts
        }
        const defaults = {
            auto: 'format,compress',
            fit: 'max',
            q: 50,
        };
        const finalParams = { ...defaults, ...params };
        Object.entries(finalParams).forEach(([k, v]) => u.searchParams.set(k, v));
        return u.toString();
    } catch (e) {
        return url;
    }
};

// Map color/type to CSS tag class (shared by cards and modal)
const getTypeColor = (type) => {
    const typeLower = (type || '').toLowerCase();
    if (typeLower.includes('red')) return 'type-red';
    if (typeLower.includes('white')) return 'type-white';
    if (typeLower.includes('sparkling') || typeLower.includes('champagne')) return 'type-sparkling';
    if (typeLower.includes('rosé') || typeLower.includes('rose') || typeLower.includes('blush')) return 'type-rose';
    if (typeLower.includes('dessert')) return 'type-dessert';
    return 'type-default';
};

// Footer Component (replicates top100.winespectator.com structure)
const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-grid">
                    <div className="footer-section">
                        <h4>Top 10 Archive</h4>
                        <ul className="footer-links">
                            <li><a href="https://top100.winespectator.com/2024">Top 10 of 2024</a></li>
                            <li><a href="https://top100.winespectator.com/2023">Top 10 of 2023</a></li>
                            <li><a href="https://top100.winespectator.com/2022">Top 10 of 2022</a></li>
                            <li><a href="https://top100.winespectator.com/2021">Top 10 of 2021</a></li>
                            <li><a href="https://top100.winespectator.com/2020">Top 10 of 2020</a></li>
                            <li><a href="https://top100.winespectator.com/2019">Top 10 of 2019</a></li>
                            <li><a href="https://top100.winespectator.com/2018">Top 10 of 2018</a></li>
                            <li><a href="https://top100.winespectator.com/2017">Top 10 of 2017</a></li>
                            <li><a href="https://top100.winespectator.com/2016">Top 10 of 2016</a></li>
                            <li><a href="https://top100.winespectator.com/2015">Top 10 of 2015</a></li>
                            <li><a href="https://top100.winespectator.com/2014">Top 10 of 2014</a></li>
                            <li><a href="https://top100.winespectator.com/2013">Top 10 of 2013</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>More from Wine Spectator</h4>
                        <ul className="footer-links">
                            <li><a href="https://www.winespectator.com/articles/about-our-tastings">Our Tastings</a></li>
                            <li><a href="http://www.mshanken.com/winespectator/">Advertising with Wine Spectator</a></li>
                            <li><a href="http://www.winespectator.com/display/show/id/privacy-policy">Privacy Policy</a></li>
                            <li><a href="http://www.winespectator.com/display/show/id/terms-of-service">Terms of Service</a></li>
                            <li><a href="http://help.winespectator.com/support/home">Help</a></li>
                            <li><a href="http://www.winespectator.com/subscribe">Wine Spectator Magazine</a></li>
                            <li><a href="http://www.winespectator.com/join">WineSpectator.com</a></li>
                            <li><a href="https://store.emags.com/mshanken">Wine Spectator Digital Edition</a></li>
                            <li><a href="http://www.winespectator.com/gift">Give a Gift Subscription</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Apps & Newsletters</h4>
                        <ul className="footer-links">
                            <li><a href="http://apps.winespectator.com/wineratingsplus/">WineRatings+</a></li>
                            <li><a href="https://apps.apple.com/us/app/restaurant-awards/id1114166113">Restaurant Awards</a></li>
                            <li><a href="https://www.winespectator.com/insider">Insider</a></li>
                            <li><a href="https://www.winespectator.com/advance">Advance</a></li>
                            <li><a href="http://newsletters.winespectator.com">Ratings Flash</a></li>
                            <li><a href="http://newsletters.winespectator.com/preferences.html">Manage Newsletter Preferences</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Partner</h4>
                        <ul className="footer-links">
                            <li><a href="https://top100.winespectator.com/cunard">Cunard</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} Wine Spectator. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

// Compute fallback label URL using logic equivalent to the provided Twig template
// Twig logic:
// colorPlusType = wine.color ~ '_' ~ wine.wine_type
// if colorPlusType == "rosé" => betterType = "rose"
// elseif colorPlusType == "rosé_still" => betterType = "rose_still"
// elseif colorPlusType == "rosé_sparkling" => betterType = "rose_sparkling"
// else betterType = colorPlusType
// fallback_label = "https://mshanken.imgix.net/wso/bolt/wine-detail/details/" ~ betterType ~ ".png"
const computeFallbackLabel = (wine) => {
    const rawColor = (wine?.color || '').toString().toLowerCase().trim();
    const rawTypeInput = (wine?.wine_type || '').toString().toLowerCase().trim();
    console.log('rawColor', rawColor);
    console.log('rawTypeInput', rawTypeInput);
    const inferredType = rawTypeInput || ((/sparkling|champagne/.test(rawColor)) ? 'sparkling' : 'still');
    console.log('inferredType', inferredType);
    const colorPlusType = inferredType ? `${rawColor}_${inferredType}` : rawColor;
    console.log('colorPlusType', colorPlusType);
    // Normalize accented rosé to rose in both standalone and prefixed forms
    let betterType = colorPlusType
        .replace(/^ros[ée]$/, 'rose')
        .replace(/^ros[ée]_/, 'rose_');
    // Guard against invalid sparkling_sparkling; default to white_sparkling
    if (betterType === 'sparkling_sparkling') {
        betterType = 'white_sparkling';
    }
    if (betterType === 'dessert_dessert') {
        betterType = 'dessert_still';
    }
    return `https://mshanken.imgix.net/wso/bolt/wine-detail/details/${betterType}.png`;
};

// Lazy Loading Image Component with responsive srcset/sizes
const LazyImage = ({ src, alt, className, placeholderSrc = 'placeholder-wine.jpg', widths = [], sizes, noPreload = false }) => {
    // Ensure placeholder works when the app is hosted under a subpath
    const resolvedPlaceholder = (() => {
        if (placeholderSrc && /^https?:\/\//.test(placeholderSrc)) return placeholderSrc;
        const file = String(placeholderSrc || 'placeholder-wine.jpg').replace(/^\//, '');
        const base = process.env.PUBLIC_URL;
        return base && base.trim() !== ''
            ? `${base.replace(/\/$/, '')}/${file}`
            : `/${file}`; // root-relative when no PUBLIC_URL
    })();


    const [imageSrc, setImageSrc] = useState(resolvedPlaceholder);
    const [imageLoading, setImageLoading] = useState(true);

    const primarySrc = widths && widths.length > 0
        ? buildImgixUrl(src, { w: widths[Math.min(1, widths.length - 1)] })
        : buildImgixUrl(src);

    const srcSet = (widths && widths.length > 0)
        ? widths.map(w => `${buildImgixUrl(src, { w })} ${w}w`).join(', ')
        : undefined;

    useEffect(() => {
        // If there's no source, show the placeholder immediately
        if (!src) {
            setImageSrc(resolvedPlaceholder);
            setImageLoading(false);
            return;
        }
        if (!primarySrc) {
            setImageSrc(resolvedPlaceholder);
            setImageLoading(false);
            return;
        }
        if (noPreload) {
            // Let the browser handle lazy loading natively without JS preloading
            setImageSrc(primarySrc);
            setImageLoading(false);
            return;
        }
        const img = new Image();
        img.srcset = srcSet || '';
        img.sizes = sizes || '';
        img.src = primarySrc;
        img.onload = () => {
            setImageSrc(primarySrc);
            setImageLoading(false);
        };
        img.onerror = () => {
            // Fall back to placeholder file path
            setImageSrc(resolvedPlaceholder);
            setImageLoading(false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src, primarySrc, srcSet, sizes, noPreload]);

    return (
        <div className={className} style={{ position: 'relative' }}>
            {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="spinner"></div>
                </div>
            )}
            <img
                src={imageSrc}
                srcSet={srcSet}
                sizes={sizes}
                alt={alt}
                loading="lazy"
                decoding="async"
                onError={() => { setImageSrc(resolvedPlaceholder); setImageLoading(false); }}
                className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            />
        </div>
    );
};

// Hook: lock body scroll while a modal/popup is open
const useBodyScrollLock = (locked) => {
    useEffect(() => {
        if (!locked) return;
        const originalOverflow = document.body.style.overflow;
        const originalPaddingRight = document.body.style.paddingRight;
        const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        if (scrollBarWidth > 0) {
            document.body.style.paddingRight = `${scrollBarWidth}px`;
        }
        return () => {
            document.body.style.overflow = originalOverflow;
            document.body.style.paddingRight = originalPaddingRight;
        };
    }, [locked]);
};

// Analytics functions
const trackEvent = (eventName, parameters = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', eventName, parameters);
    }
};

const trackWineView = (wine) => {
    trackEvent('view_item', {
        currency: 'USD',
        value: wine.price,
        items: [{
            item_id: wine.id,
            item_name: wine.wine_full,
            item_category: wine.color,
            price: wine.price,
            quantity: 1
        }]
    });
};

const trackTastingAction = (wine, action) => {
    trackEvent('wine_tasting_action', {
        wine_id: wine.id,
        wine_name: wine.wine_full,
        action: action,
        wine_price: wine.price,
        wine_score: wine.score
    });
};

// (trackSearch removed – not used)

const trackFilterUse = (filterType, filterValue) => {
    trackEvent('filter_wines', {
        filter_type: filterType,
        filter_value: filterValue
    });
};

const trackExport = (format, itemCount) => {
    trackEvent('export_list', {
        export_format: format,
        items_exported: itemCount
    });
};

// (top-level wines mapping removed – state `wines` is the source of truth per selectedYear)

const Icons = {
    Wine: ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2h8l1 7c0 2.5-2 4.5-4.5 4.5S8 11.5 8 9l1-7z" /><line x1="12" y1="13.5" x2="12" y2="20" /><line x1="9" y1="20" x2="15" y2="20" /><ellipse cx="12" cy="9" rx="3.5" ry="2" fill="currentColor" opacity="0.3"/></svg>),
    Search: ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>),
    Grid: ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>),
    List: ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>),
    X: ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>),
    Menu: ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>),
    Download: ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>),
    Compare: ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>),
    Check: ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>),
    ArrowUp: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 15 12 9 18 15" />
        </svg>
    ),
    ChevronDown: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    ),
    ChevronUp: ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 15 12 9 18 15" />
        </svg>
    ),
};

// FIXED Scroll Animation Hook
const useScrollAnimation = () => {
    useEffect(() => {
        const elements = document.querySelectorAll('.reveal');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        elements.forEach((el) => observer.observe(el));

        return () => {
            observer.disconnect();
        };
    }, []);
};

// Export Button Component
const ExportButton = ({ tastingRecord, wines, selectedYear }) => {
    const [showMenu, setShowMenu] = useState(false);
    
    // Only include entries that exist in the current year's wine list
    const wineIdSet = new Set(wines.map(w => String(w.id)));
    const filteredEntries = Object.entries(tastingRecord).filter(([wineId]) => wineIdSet.has(String(wineId)));
    
    const exportTastingList = (format) => {
        const data = filteredEntries.map(([wineId, status]) => {
            const wine = wines.find(w => String(w.id) === String(wineId));
            if (!wine) return null;
            return {
                Rank: wine.top100_rank ? parseInt(wine.top100_rank, 10) : 0,
                Wine: wine.wine_full,
                Winery: wine.winery_full,
                Vintage: wine.vintage,
                Color: wine.color,
                Region: wine.region,
                Country: wine.country,
                Status: status === 'tasted' ? 'Tasted' : 'Want to Taste',
                Score: wine.score,
                Price: `$${wine.price}`
            };
        }).filter(Boolean);

        if (format === 'csv') {
            const csv = [
                Object.keys(data[0]).join(','),
                ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wine-tasting-list-${selectedYear}-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } else if (format === 'json') {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wine-tasting-list-${selectedYear}-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        trackExport(format, data.length);
        setShowMenu(false);
    };

    const itemCount = filteredEntries.length;
    if (itemCount === 0) return null;

    return (
        <div className="export-button-container">
            <button 
                className="btn-modern export-button"
                onClick={() => setShowMenu(!showMenu)}
            >
                <Icons.Download className="export-icon" />
                Export List ({itemCount})
            </button>
            {showMenu && (
                <div className="export-menu">
                    <button 
                        onClick={() => exportTastingList('csv')}
                        className="export-menu-item"
                    >
                        Export as CSV
                    </button>
                    <button 
                        onClick={() => exportTastingList('json')}
                        className="export-menu-item"
                    >
                        Export as JSON
                    </button>
                </div>
            )}
        </div>
    );
};

const TastingCheckbox = ({ wineId, tastingRecord, onTasteChange, status }) => {
    const key = String(wineId);
    const isChecked = tastingRecord[key] === status;
    const handleChange = () => onTasteChange(key, isChecked ? null : status);
    const stop = (e) => {
        // Prevent clicks on the checkbox/label from bubbling up to card-level handlers
        e.stopPropagation();
    };
    
    return (
        <label className="tasting-checkbox" onClick={stop} onMouseDown={stop} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') stop(e); }}>
            <input 
                type="checkbox" 
                checked={isChecked} 
                onChange={handleChange} 
                onClick={stop}
                onMouseDown={stop}
            />
            <span>{status === 'tasted' ? 'I have tasted this' : 'I want to taste this'}</span>
        </label>
    );
};


// Share Tasting List Component
const ShareTastingList = ({ tastingRecord, wines, selectedYear }) => {
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareLink, setShareLink] = useState('');
    const [copied, setCopied] = useState(false);

    // Lock body scroll when share modal is open
    useBodyScrollLock(showShareModal);

    // Close share modal on Escape
    useEffect(() => {
        if (!showShareModal) return;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setShowShareModal(false);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [showShareModal]);

    // Only include entries that exist in the current year's wine list
    const wineIdSetShare = new Set(wines.map(w => String(w.id)));
    const filteredShareEntries = Object.entries(tastingRecord).filter(([wineId]) => wineIdSetShare.has(String(wineId)));

    const generateShareLink = () => {
        const tastedIds = filteredShareEntries
            .filter(([_, status]) => status === 'tasted')
            .map(([wineId]) => wineId);
        const tastedWineIds = tastedIds.join(',');

        const link = `${window.location.origin}${window.location.pathname}?year=${encodeURIComponent(selectedYear)}&tasted=${tastedWineIds}`;
        setShareLink(link);
        setShowShareModal(true);
        trackEvent('share_tasting_list', { wine_count: tastedIds.length });
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const itemCount = filteredShareEntries.length;
    if (itemCount === 0) return null;

    return (
        <>
            <button 
                className="btn-modern share-list-button"
                onClick={generateShareLink}
            >
                <span className="share-icon">🔗</span>
                Share My List
            </button>

            {showShareModal && (
                <div className="modal-overlay">
                    <div className="modal-backdrop" onClick={() => setShowShareModal(false)} />
                    <div className="modal-content share-modal">
                        <button onClick={() => setShowShareModal(false)} className="modal-close">
                            <Icons.X className="icon-close" />
                        </button>
                        
                        <h2>Share Your Tasting List</h2>
                        <p>Share your wine journey with friends!</p>
                        
                        <div className="share-link-container">
                            <input 
                                type="text" 
                                value={shareLink} 
                                readOnly 
                                className="share-link-input"
                            />
                            <button onClick={copyToClipboard} className="btn-modern">
                                {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                        </div>
                        
                        <div className="share-stats">
                            <p>Your list includes:</p>
                            <ul>
                                <li>{filteredShareEntries.filter(([_, status]) => status === 'tasted').length} wines tasted</li>
                                <li>{filteredShareEntries.filter(([_, status]) => status === 'want').length} wines to try</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
// Tasting Tracker Side Panel Component
const TastingTrackerPanel = ({ isOpen, onToggle, tastingRecord, wines, onTasteChange, selectedYear }) => {
    const tastedWines = [];
    const wantToTasteWines = [];
    
    // Organize wines by status
    Object.entries(tastingRecord).forEach(([wineId, status]) => {
        const wine = wines.find(w => String(w.id) === String(wineId));
        if (wine) {
            if (status === 'tasted') {
                tastedWines.push(wine);
            } else if (status === 'want') {
                wantToTasteWines.push(wine);
            }
        }
    });

    const totalCount = tastedWines.length + wantToTasteWines.length;

    // Local dismissed state and logic to re-show when a new wine is added
    const [dismissed, setDismissed] = useState(false);
    const prevCountRef = useRef(totalCount);

    useEffect(() => {
        // Re-show the tab when the total count increases (a new wine is added)
        if (totalCount > prevCountRef.current) {
            setDismissed(false);
        }
        prevCountRef.current = totalCount;
    }, [totalCount]);

    // Also re-show the tab if the user edits an existing wine's status
    // (e.g., switches from "want" to "tasted") while there is at least one selection
    useEffect(() => {
        if (totalCount > 0) {
            setDismissed(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tastingRecord]);

    // Hide the Saved Wines tab and panel until there is at least one selection
    if (totalCount === 0 || dismissed) return null;

    return (
        <>
            {/* Fixed Tab Button */}
            <button 
                className={`tasting-tracker-tab ${isOpen ? 'tab-open' : ''}`}
                onClick={onToggle}
            >
                <span className="tab-text">Saved Wines</span>
                <span className="tab-count">{totalCount}</span>
                <span
                    className="tab-hide"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); setDismissed(true); if (isOpen) onToggle(); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setDismissed(true); if (isOpen) onToggle(); } }}
                    aria-label="Hide Saved Wines"
                    title="Hide Saved Wines"
                >
                    (hide)
                </span>
            </button>

            {/* Sliding Panel */}
            <div className={`tasting-tracker-panel ${isOpen ? 'panel-open' : ''}`}>
                <div className="panel-header">
                    <h3>Saved Wines</h3>
                    <button onClick={onToggle} className="panel-close">
                        <Icons.X className="icon-close" />
                    </button>
                </div>

                <div className="panel-stats">
                    <div className="stat-item">
                        <span className="stat-number">{tastedWines.length}</span>
                        <span className="stat-label">Tasted</span>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <span className="stat-number">{wantToTasteWines.length}</span>
                        <span className="stat-label">Want to Taste</span>
                    </div>
                </div>

                <div className="panel-content">
                    {/* Tasted Section */}
                    {tastedWines.length > 0 && (
                        <div className="panel-section">
                            <h4 className="section-title">Tasted Wines</h4>
                            <div className="mini-wine-list">
                                {tastedWines.map(wine => (
                                    <div key={wine.id} className="mini-wine-card">
                                        {wine.label_url ? (
                                            <LazyImage
                                                src={wine.label_url}
                                                alt={wine.wine_full}
                                                className="mini-wine-image"
                                                widths={[80, 120, 160]}
                                                sizes="80px"
                                            />
                                        ) : (
                                            <LazyImage
                                                src={computeFallbackLabel(wine)}
                                                alt={wine.wine_full}
                                                className="mini-wine-image"
                                                widths={[80, 120, 160]}
                                                sizes="80px"
                                            />
                                        )}
                                        <div className="mini-wine-info">
                                            <h5>{wine.wine_full}</h5>
                                            <p>{wine.winery_full}</p>
                                            <span className="mini-wine-price">${wine.price}</span>
                                        </div>
                                        <button 
                                            onClick={() => onTasteChange(wine.id, null)}
                                            className="remove-btn"
                                            title="Remove from list"
                                        >
                                            <Icons.X className="icon-small" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Want to Taste Section */}
                    {wantToTasteWines.length > 0 && (
                        <div className="panel-section">
                            <h4 className="section-title">Want to Taste</h4>
                            <div className="mini-wine-list">
                                {wantToTasteWines.map(wine => (
                                    <div key={wine.id} className="mini-wine-card">
                                        {wine.label_url ? (
                                            <LazyImage
                                                src={wine.label_url}
                                                alt={wine.wine_full}
                                                className="mini-wine-image"
                                                widths={[80, 120, 160]}
                                                sizes="80px"
                                            />
                                        ) : (
                                            <LazyImage
                                                src={computeFallbackLabel(wine)}
                                                alt={wine.wine_full}
                                                className="mini-wine-image"
                                                widths={[80, 120, 160]}
                                                sizes="80px"
                                            />
                                        )}
                                        <div className="mini-wine-info">
                                            <h5>{wine.wine_full}</h5>
                                            <p>{wine.winery_full}</p>
                                            <span className="mini-wine-price">${wine.price}</span>
                                        </div>
                                        <button 
                                            onClick={() => onTasteChange(wine.id, null)}
                                            className="remove-btn"
                                            title="Remove from list"
                                        >
                                            <Icons.X className="icon-small" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {totalCount === 0 && (
                        <div className="empty-state">
                            <Icons.Wine className="empty-icon" />
                            <p>Start tracking your wine journey!</p>
                            <p className="empty-subtitle">Click the checkboxes on wine cards to add them to your list.</p>
                        </div>
                    )}
                </div>

                {totalCount > 0 && (
                    <div className="panel-footer">
                        <ExportButton tastingRecord={tastingRecord} wines={wines} selectedYear={selectedYear} />
                        <ShareTastingList tastingRecord={tastingRecord} wines={wines} selectedYear={selectedYear} />
                    </div>
                )}
            </div>

            {/* Backdrop */}
            {isOpen && <div className="panel-backdrop" onClick={onToggle} />}
        </>
    );
};

// Wine Comparison Bar Component
const ComparisonBar = ({ compareWines, onRemove, onCompare }) => {
    if (compareWines.length === 0) return null;

    return (
        <div className={`comparison-bar ${compareWines.length > 0 ? 'show' : ''}`}>
            <div className="comparison-content">
                <div className="comparison-header">
                    <h4>Compare Wines ({compareWines.length}/3)</h4>
                    {compareWines.length >= 2 && (
                        <button className="btn-modern btn-small" onClick={onCompare}>
                            Compare Now
                        </button>
                    )}
                </div>
                <div className="comparison-wines">
                    {compareWines.map(wine => (
                        <div key={wine.id} className="comparison-wine-item">
                            {wine.label_url ? (
                                <LazyImage 
                                    src={wine.label_url}
                                    alt={wine.wine_full}
                                    className="comparison-thumb"
                                    widths={[80, 120]}
                                    sizes="80px"
                                />
                            ) : (
                                <LazyImage 
                                    src={computeFallbackLabel(wine)}
                                    alt={wine.wine_full}
                                    className="comparison-thumb"
                                    widths={[80, 120]}
                                    sizes="80px"
                                />
                            )}
                            <div className="comparison-wine-info">
                                <span className="wine-name">{wine.wine_full}</span>
                                <span className="wine-vintage">{wine.vintage}</span>
                            </div>
                            <button 
                                className="remove-compare-btn"
                                onClick={() => onRemove(wine.id)}
                            >
                                <Icons.X className="icon-small" />
                            </button>
                        </div>
                    ))}
                    {[...Array(3 - compareWines.length)].map((_, index) => (
                        <div key={`empty-${index}`} className="comparison-wine-empty">
                            <Icons.Wine className="empty-wine-icon" />
                            <span>Add wine to compare</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Wine Comparison Modal Component
const ComparisonModal = ({ wines, isOpen, onClose }) => {
    // Close on Escape (hook must be before any early return)
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    // Lock body scroll when comparison modal is open
    useBodyScrollLock(isOpen);

    if (!isOpen || !wines || wines.length === 0) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose} />
            <div className="modal-content comparison-modal">
                <button onClick={onClose} className="modal-close">
                    <Icons.X className="icon-close" />
                </button>
                
                <div className="comparison-modal-header">
                    <h2>Wine Comparison</h2>
                    <p>Compare up to 3 wines side by side</p>
                </div>

                <div className="comparison-grid">
                    {wines.map(wine => {
                        // Extract rank from the top100_rank property or use the id as fallback
                        const rank = wine.top100_rank ? parseInt(wine.top100_rank, 10) : parseInt(wine.id, 10);
                        
                        // Extract price and score with fallbacks
                        const price = wine.price || 0;
                        const score = wine.score || 0;
                        
                        return (
                            <div key={wine.id} className="comparison-column">
                                <div className="comparison-wine-header">
                                    {wine.label_url ? (
                                        <LazyImage 
                                            src={wine.label_url}
                                            alt={wine.wine_full}
                                            className="comparison-wine-image"
                                            widths={[320, 480, 640, 800]}
                                            sizes="(min-width: 1024px) 26vw, 90vw"
                                        />
                                    ) : (
                                        <LazyImage 
                                            src={computeFallbackLabel(wine)}
                                            alt={wine.wine_full}
                                            className="comparison-wine-image"
                                            widths={[320, 480, 640, 800]}
                                            sizes="(min-width: 1024px) 26vw, 90vw"
                                        />
                                    )}
                                    <h3>{wine.wine_full}</h3>
                                    <p className="comparison-winery">{wine.winery_full}</p>
                                </div>

                                <div className="comparison-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Rank</span>
                                        <span className="detail-value">#{rank}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Score</span>
                                        <span className="detail-value score">{score} pts</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Price</span>
                                        <span className="detail-value price">${price}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Type</span>
                                        <span className="detail-value">{wine.color}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Vintage</span>
                                        <span className="detail-value">{wine.vintage}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Region</span>
                                        <span className="detail-value">{wine.region || 'Unknown Region'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Country</span>
                                        <span className="detail-value">{wine.country}</span>
                                    </div>
                                </div>

                                <div className="comparison-description">
                                    <h4>Tasting Notes</h4>
                                    <p>{wine.note || 'No tasting note available.'}</p>
                                </div>
                            </div>
                        );
                    })}                 </div>
            </div>
        </div>
    );
};

// Enhanced Search Component removed per request


const WineCard = ({ wine, onSelect, compareWines, onCompareToggle, tastingRecord, onTasteChange, isCondensed, onAddToPWL, selectedYear }) => {
    const isInComparison = compareWines.some(w => w.id === wine.id);
    
    // Extract rank from the top100_rank property or use the id as fallback
    const wineRank = wine.top100_rank ? parseInt(wine.top100_rank, 10) : parseInt(wine.id, 10);
    
    // Extract score with fallback
    const score = wine.score || 0;

    const getRankColor = () => {
        const color = wine.color ? wine.color.toLowerCase() : '';
        if (color === 'red') return 'rank-red';
        if (color === 'white') return 'rank-white';
        if (color === 'rosé' || color === 'rose' || color === 'blush') return 'rank-rose';
        if (color === 'sparkling' || color === 'champagne') return 'rank-sparkling';
        if (color === 'dessert') return 'rank-dessert';
        return 'rank-default';
    };

    const getTypeColor = (type) => {
        const typeLower = (type || '').toLowerCase();
        if (typeLower.includes('red')) return 'type-red';
        if (typeLower.includes('white')) return 'type-white';
        if (typeLower.includes('sparkling')) return 'type-sparkling';
        if (typeLower.includes('rosé')) return 'type-rose';
        return 'type-default';
    };

    if (isCondensed) {
        const showVideoCondensed = Number(selectedYear) >= 2013 && wineRank <= 10;
        return (
            <div className="wine-card-condensed">
                <div className={`wine-rank-condensed ${getRankColor()}`}>{wineRank}</div>
                <div className="wine-image-condensed" onClick={() => { console.log('[WineCard] onSelect (condensed) clicked', { id: wine.id, name: wine.wine_full }); onSelect(wine); }}>
                {wine.label_url ? (
                    <LazyImage 
                        src={wine.label_url} 
                        alt={wine.wine_full} 
                        className="wine-bottle-image"
                        widths={[160, 240, 320]}
                        sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                    />
                ) : (
                    <LazyImage 
                        src={computeFallbackLabel(wine)} 
                        alt={wine.wine_full} 
                        className="wine-bottle-image"
                        widths={[160, 240, 320]}
                        sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                    />
                )}
                </div>
                <div className="wine-info-condensed" onClick={() => { console.log('[WineCard] onSelect (condensed info) clicked', { id: wine.id, name: wine.wine_full }); onSelect(wine); }}>
                    <h3 className="condensed-winery">{wine.winery_full}</h3>
                    <p className="condensed-wine-name">
                        {wine.wine_full}
                        {wine.vintage ? <span className="condensed-vintage"> {wine.vintage}</span> : null}
                    </p>
                    <div className="tasting-options-condensed">
                        <TastingCheckbox wineId={wine.id} tastingRecord={tastingRecord} onTasteChange={onTasteChange} status="tasted" />
                        <TastingCheckbox wineId={wine.id} tastingRecord={tastingRecord} onTasteChange={onTasteChange} status="want" />
                    </div>
                </div>
                <div className="wine-details-condensed">
                    <div className="price-score-row">
                        <span className="wine-score-condensed">{score} pts{(wine.price !== undefined && wine.price !== null) ? ` / $${Math.round(wine.price)}` : ''}</span>
                        {showVideoCondensed && (
                            <a
                                className="btn-video btn-small"
                                href={`https://top100.winespectator.com/${selectedYear}/video/?play=${wineRank}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => { e.stopPropagation(); trackEvent('watch_video_clicked', { year: selectedYear, rank: wineRank, wineId: wine.id }); }}
                                aria-label="Watch the video"
                                title="Watch the video"
                            >
                                <span className="label-full">Watch the video</span>
                                <span className="label-short">Video</span>
                            </a>
                        )}
                        <button
                            className="btn-pwl btn-pwl-small"
                            onClick={() => onAddToPWL(wine)}
                            aria-label="Save to Personal Wine List"
                            title="Save to Personal Wine List"
                        >
                            <span className="label-full">Save to Personal Wine List</span>
                            <span className="label-short">Save to PWL</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const showVideo = Number(selectedYear) >= 2013 && wineRank <= 10;

    return (
        <div className="wine-card-modern">
            <div className={`wine-rank ${getRankColor()}`}>{wineRank}</div>
            <div className="wine-score-badge">
                <span className="score-value">{score}</span>
                <span className="score-label">points</span>
            </div>
            {isInComparison && (
                <div className="comparison-badge">
                    <Icons.Check className="icon-small" />
                </div>
            )}
            <div className="wine-image" onClick={() => { console.log('[WineCard] onSelect (image) clicked', { id: wine.id, name: wine.wine_full }); onSelect(wine); }}>
                {wine.label_url ? (
                    <LazyImage 
                        src={wine.label_url} 
                        alt={`Bottle of ${wine.wine_full}`} 
                        className="wine-bottle-image"
                        widths={[240, 360, 480]}
                        sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 90vw"
                    />
                ) : (
                    <LazyImage 
                        src={computeFallbackLabel(wine)} 
                        alt={`Bottle of ${wine.wine_full}`} 
                        className="wine-bottle-image"
                        widths={[240, 360, 480]}
                        sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 90vw"
                    />
                )}
            </div>
            <div className="wine-content">
                <div className="wine-header">
                    <h3 className="wine-winery-name" onClick={() => { console.log('[WineCard] onSelect (winery) clicked', { id: wine.id, name: wine.wine_full }); onSelect(wine); }}>{wine.winery_full}</h3>
                    <h2 className="wine-name" onClick={() => { console.log('[WineCard] onSelect (name) clicked', { id: wine.id, name: wine.wine_full }); onSelect(wine); }}>
                        {wine.wine_full}
                        {wine.vintage ? <span className="vintage-inline"> {wine.vintage}</span> : null}
                    </h2>
                    {(wine.price !== undefined && wine.price !== null) && (
                        <p className="wine-price">${Math.round(wine.price)}</p>
                    )}
                </div>
                <div className="wine-metadata">
                    <div className="wine-tags">
                        <span className={`wine-tag ${getTypeColor(wine.color)}`}>{wine.color}</span>
                        <span className="wine-tag">{wine.country || 'Unknown Country'}</span>
                        <span className="wine-tag">{wine.region || 'Unknown Region'}</span>
                    </div>
                    <div className="tasting-options">
                        <TastingCheckbox wineId={wine.id} tastingRecord={tastingRecord} onTasteChange={onTasteChange} status="tasted" />
                        <TastingCheckbox wineId={wine.id} tastingRecord={tastingRecord} onTasteChange={onTasteChange} status="want" />
                    </div>
                    <div className="wine-footer">
                        <button className="btn-modern btn-small" onClick={() => { console.log('[WineCard] View Details clicked', { id: wine.id, name: wine.wine_full }); onSelect(wine); trackEvent('view_details_clicked', { wineId: wine.id }); }}>View Details</button>
                        {showVideo && (
                            <a
                                className="btn-video btn-small"
                                href={`https://top100.winespectator.com/${selectedYear}/video/?play=${wineRank}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackEvent('watch_video_clicked', { year: selectedYear, rank: wineRank, wineId: wine.id })}
                            >
                                Watch the video
                            </a>
                        )}
                        <button 
                            className="btn-pwl"
                            onClick={() => onAddToPWL(wine)}
                        >
                            Save to Personal Wine List
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// PWL Response Modal for displaying PWL response
const PWLResponseModal = ({ isOpen, onClose, wineName, responseData }) => {
    // Close on Escape (hook must be before any early return)
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Lock body scroll when PWL modal is open
    useBodyScrollLock(isOpen);

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop pwl-modal-backdrop">
            <div className="modal pwl-modal">
                <div className="modal-header">
                    <h3>Add to Personal Wine List</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-content">
                    <h4>{wineName}</h4>
                    
                    {!responseData ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Adding to your Personal Wine List...</p>
                        </div>
                    ) : responseData.success ? (
                        <div className="pwl-success">
                            <p>Successfully added to your Personal Wine List!</p>
                        </div>
                    ) : (
                        <div className="pwl-error">
                            <p>Error adding to Personal Wine List:</p>
                            <p className="error-message">{responseData.error}</p>
                            <p><strong>Wine ID:</strong> {responseData.wineId}</p>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn-modern" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

const WineDetailModal = ({ wine, isOpen, onClose, tastingRecord, onTasteChange, onAddNote }) => {
    useEffect(() => {
        if (isOpen && wine) {
            console.group('[WineDetailModal] Open');
            console.log('Timestamp:', new Date().toISOString());
            console.log('Wine selected:', { id: wine.id, name: wine.wine_full, vintage: wine.vintage, score: wine.score, price: wine.price });
            console.groupEnd();
            trackWineView(wine);
        }
        return () => {
            if (isOpen && wine) {
                console.group('[WineDetailModal] Unmount/Close');
                console.log('Timestamp:', new Date().toISOString());
                console.log('Last wine:', { id: wine.id, name: wine.wine_full });
                console.groupEnd();
            }
        };
    }, [isOpen, wine]);

    useEffect(() => {
        console.log('[WineDetailModal] Props changed', { isOpen, wineId: wine?.id });
    }, [isOpen, wine?.id]);

    // Close on Escape (hook must be before any early return)
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Lock body scroll when detail modal is open
    useBodyScrollLock(isOpen);

    if (!isOpen || !wine) return null;

    // Extract price and score with fallbacks
    const price = wine.price || 0;
    const score = wine.score || 0;

    const stopPropagation = (e) => {
        console.log('[WineDetailModal] stopPropagation called');
        e.stopPropagation();
    };

    const handleCloseClick = () => {
        console.log('[WineDetailModal] Close button clicked');
        onClose();
    };
    
    
    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" />
            <div className="modal-content wine-detail-modal" onClick={stopPropagation}>
                <button onClick={handleCloseClick} className="modal-close">
                    <Icons.X className="icon-close" />
                </button>
                <div className="wine-detail-grid">
                    <div className="wine-detail-image">
                        {wine.label_url ? (
                            <LazyImage 
                                src={wine.label_url}
                                alt={`Bottle of ${wine.wine_full}`}
                                className="wine-detail-image"
                                widths={[480, 640, 800]}
                                sizes="(min-width: 1024px) 44vw, 90vw"
                            />
                        ) : (
                            <LazyImage 
                                src={computeFallbackLabel(wine)} 
                                alt={`Bottle of ${wine.wine_full}`} 
                                className="wine-detail-image"
                                widths={[480, 640, 800]}
                                sizes="(min-width: 1024px) 44vw, 90vw"
                            />
                        )}
                    </div>
                    <div className="wine-detail-info">
                        <h2>{wine.winery_full}</h2>
                        <p className="wine-subtitle">{wine.wine_full} {wine.vintage}</p>
                        <div className="wine-tags">
                            <span className={`wine-tag ${getTypeColor(wine.color)}`}>{wine.color}</span>
                            <span className="wine-tag">{wine.country || 'Unknown Country'}</span>
                            <span className="wine-tag">{wine.region || 'Unknown Region'}</span>
                        </div>
                        <h4>Tasting Note</h4>
                        <p className="wine-description">{wine.note || 'No tasting note available.'}</p>
                        <div className="tasting-section">
                            <TastingCheckbox wineId={wine.id} tastingRecord={tastingRecord} onTasteChange={onTasteChange} status="tasted" />
                            <TastingCheckbox wineId={wine.id} tastingRecord={tastingRecord} onTasteChange={onTasteChange} status="want" />
                        </div>
                        <div className="wine-detail-footer">
                            <span className="wine-score-xl">{score} Points</span>
                            <span className="wine-price-xl">${price}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Navigation = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route/hash changes or resize to desktop
    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 768) setMobileOpen(false);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Force light links to match a permanent dark header
    const linkClass = 'nav-link-light';

    return (
        <nav className={`navbar-modern ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container">
                <a href="https://top100.winespectator.com/" className="logo-container" aria-label="Top 100 Home">
                    <div className="logo-background" style={{ backgroundColor: 'transparent' }}>
                        <img
                            src={process.env.PUBLIC_URL + '/logo.png'}
                            alt="Wine Spectator Logo"
                            className="navbar-logo"
                        />
                    </div>
                </a>

                {/* Desktop menu */}
                <div className="navbar-menu" role="navigation" aria-label="Primary">
                    <a href="https://top100.winespectator.com/2024" className={linkClass}>Top 10 of 2024</a>
                    <a href="https://top100.winespectator.com/lists" className={linkClass}>All Top 100 Lists</a>
                    <a href="https://top100.winespectator.com/2024/video" className={linkClass}>Videos</a>
                    <a href="https://top100.winespectator.com/archives" className={linkClass}>Past Years’ Top 10s</a>
                    <a href="https://www.winespectator.com/issues/wine-value-of-the-year-2025-02-28" className={linkClass}>Top Wine Values of 2024</a>
                </div>

                {/* Mobile toggle button */}
                <button
                    className={`navbar-toggle light`}
                    aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={mobileOpen}
                    onClick={() => setMobileOpen(v => !v)}
                >
                    {mobileOpen ? <Icons.X className="toggle-icon" /> : <Icons.Menu className="toggle-icon" />}
                </button>
            </div>

            {/* Mobile dropdown */}
            {mobileOpen && (
                <div className={`mobile-menu ${scrolled ? 'scrolled' : ''}`} role="menu">
                    <a href="https://top100.winespectator.com/2024" className="mobile-menu-link" role="menuitem" onClick={() => setMobileOpen(false)}>Top 10 of 2024</a>
                    <a href="https://top100.winespectator.com/lists" className="mobile-menu-link" role="menuitem" onClick={() => setMobileOpen(false)}>All Top 100 Lists</a>
                    <a href="https://top100.winespectator.com/2024/video" className="mobile-menu-link" role="menuitem" onClick={() => setMobileOpen(false)}>Videos</a>
                    <a href="https://top100.winespectator.com/archives" className="mobile-menu-link" role="menuitem" onClick={() => setMobileOpen(false)}>Past Years’ Top 10s</a>
                    <a href="https://www.winespectator.com/issues/wine-value-of-the-year-2025-02-28" className="mobile-menu-link" role="menuitem" onClick={() => setMobileOpen(false)}>Top Wine Values of 2024</a>
                </div>
            )}
        </nav>
    );
};


const FilterBar = ({ filters, onFiltersChange, isCondensed, onViewChange, currentWines }) => {
    // Build option lists constrained by the other active selections
    const colorSource = currentWines.filter(wine =>
        (filters.country === 'All' || wine.country === filters.country) &&
        (filters.wineType === 'All' || wine.wine_type === filters.wineType)
    );
    // Exclude Dessert and Sparkling from Wine Color filter
    const allColors = [...new Set(colorSource.map(wine => wine.color))]
        .filter(Boolean)
        .filter(c => c !== 'Dessert' && c !== 'Sparkling');
    const preferredColorOrder = ['Red', 'White', 'Rosé'];
    const colorOptions = [
        'All',
        ...preferredColorOrder.filter(c => allColors.includes(c)),
        ...allColors.filter(c => !preferredColorOrder.includes(c)).sort((a, b) => String(a).localeCompare(String(b)))
    ];

    const countrySource = currentWines.filter(wine =>
        (filters.color === 'All' || wine.color === filters.color) &&
        (filters.wineType === 'All' || wine.wine_type === filters.wineType)
    );
    const allCountries = [...new Set(countrySource.map(wine => wine.country))].filter(Boolean);
    const countryOptions = ['All', ...allCountries.sort((a, b) => String(a).localeCompare(String(b)))];

    const typeSource = currentWines.filter(wine =>
        (filters.color === 'All' || wine.color === filters.color) &&
        (filters.country === 'All' || wine.country === filters.country)
    );
    const allWineTypes = [...new Set(typeSource.map(wine => wine.wine_type))].filter(Boolean);
    const wineTypePriority = { still: 0, sparkling: 1 };
    const sortedWineTypes = [...allWineTypes].sort((a, b) => {
        const ap = wineTypePriority[String(a).toLowerCase()] ?? 2;
        const bp = wineTypePriority[String(b).toLowerCase()] ?? 2;
        if (ap !== bp) return ap - bp;
        // Secondary sort by humanized label
        const al = String(a).toLowerCase().replace(/_/g, ' ');
        const bl = String(b).toLowerCase().replace(/_/g, ' ');
        return al.localeCompare(bl);
    });
    const wineTypeOptions = ['All', ...sortedWineTypes];
    
    const formatWineTypeLabel = (wt) => {
        if (!wt) return '';
        const s = String(wt).toLowerCase().replace(/_/g, ' ');
        // Title case each word
        const titled = s.replace(/\b\w/g, (c) => c.toUpperCase());
        // Optional: enhance common terms
        return titled
            .replace(/\bRose\b/, 'Rosé');
    };

    const handleFilterChange = (filterType, value) => {
        // Preserve the other filter; the lists (allColors/allCountries) already reflect the intersection
        onFiltersChange({ ...filters, [filterType]: value });
        trackFilterUse(filterType, value);
    };

    return (
        <div className="filter-bar">
            <div className="filter-grid">
                <div className="filter-col filter-col-left">
                    <div className="filter-section">
                        <p className="filter-label">Wine Color</p>
                        <div className="filter-buttons">
                            {colorOptions.map(color => (
                                <button 
                                    key={color} 
                                    onClick={() => handleFilterChange('color', color)} 
                                    className={filters.color === color ? 'filter-btn active' : 'filter-btn'}
                                >
                                    {color}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="filter-section">
                        <p className="filter-label">Wine Type</p>
                        <div className="filter-buttons">
                            {wineTypeOptions.map(wt => (
                                <button 
                                    key={wt} 
                                    onClick={() => handleFilterChange('wineType', wt)} 
                                    className={filters.wineType === wt ? 'filter-btn active' : 'filter-btn'}
                                >
                                    {wt === 'All' ? 'All' : formatWineTypeLabel(wt)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="filter-col filter-col-right">
                    <div className="filter-section">
                        <p className="filter-label">Country</p>
                        <div className="filter-buttons">
                            {countryOptions.map(country => (
                                <button 
                                    key={country} 
                                    onClick={() => handleFilterChange('country', country)} 
                                    className={filters.country === country ? 'filter-btn active' : 'filter-btn'}
                                >
                                    {country}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [selectedYear, setSelectedYear] = useState(2024);
    const [wines, setWines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showBackToTop, setShowBackToTop] = useState(false);
    
    // Load wine data when selectedYear changes
    useEffect(() => {
        const loadWineData = async () => {
            try {
                setIsLoading(true);
                // Use dynamic import for loading from src/data
                let wineData;
                if (selectedYear === 2024) {
                    // For 2024, we already have the data imported at the top
                    wineData = winesData;
                } else {
                    try {
                        // For other years, try dynamic import
                        const module = await import(`./data/wines-${selectedYear}.json`);
                        wineData = module.default;
                    } catch (importError) {
                        console.error(`Failed to import data for ${selectedYear}:`, importError);
                        // Fallback to 2024 data if the selected year's data doesn't exist
                        wineData = winesData;
                    }
                }
                
                // Normalize wine data before setting it
                const normalizedWineData = wineData.map(wine => {
                    // Create a copy to avoid mutating the original data
                    const normalizedWine = { ...wine };
                    
                    // Normalize wine color/type
                    if (normalizedWine.color) {
                        const color = normalizedWine.color.toLowerCase();
                        // Standardize color names
                        if (color === 'blush' || color.includes('rosé') || color.includes('rose')) {
                            normalizedWine.color = 'Rosé';
                        } else if (color.includes('red')) {
                            normalizedWine.color = 'Red';
                        } else if (color.includes('white')) {
                            normalizedWine.color = 'White';
                        } else if (color.includes('sparkling') || color.includes('champagne')) {
                            normalizedWine.color = 'Sparkling';
                        } else if (color.includes('dessert')) {
                            normalizedWine.color = 'Dessert';
                        }
                    }
                    
                    return normalizedWine;
                });
                
                // Set normalized wines data and stop loading
                setWines(normalizedWineData);
            } catch (error) {
                console.error('Error loading wine data:', error);
                setWines([]);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadWineData();
    }, [selectedYear]);

    const [selectedWine, setSelectedWine] = useState(null);
    const [filters, setFilters] = useState({ search: '', color: 'All', country: 'All', wineType: 'All' });
    const [isCondensed, setIsCondensed] = useState(false);
    const [showFilters, setShowFilters] = useState(() => {
        try {
            const saved = localStorage.getItem('showFilters');
            return saved !== null ? saved === 'true' : true;
        } catch (e) {
            return true;
        }
    });
    const [showTastingPanel, setShowTastingPanel] = useState(false);
    const [compareWines, setCompareWines] = useState([]);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
    const [tastingRecord, setTastingRecord] = useState(() => {
        try {
            const savedRecord = localStorage.getItem('tastingRecord');
            return savedRecord ? JSON.parse(savedRecord) : {};
        } catch (error) {
            return {};
        }
    });
    const [pwlModalOpen, setPwlModalOpen] = useState(false);
    const [pwlResponseData, setPwlResponseData] = useState(null);
    const [pwlWineName, setPwlWineName] = useState('');

    // Persist filters visibility preference
    useEffect(() => {
        try {
            localStorage.setItem('showFilters', String(showFilters));
        } catch (e) {
            // ignore storage failures
        }
    }, [showFilters]);

    // Handle Save to PWL button click
    const API_BASE = process.env.REACT_APP_API_BASE || 'https://www.winespectator.com';
    const PWL_PATH = process.env.REACT_APP_PWL_PATH || '/pwl/apiAdditem';
    const USE_API  = String(process.env.REACT_APP_PWL_API_ENABLED).toLowerCase() === 'true';

    const handleAddToPWL = async (wine) => {
        setPwlWineName(`${wine.winery_full} ${wine.wine_full} ${wine.vintage}`);
        setPwlResponseData(null);
        setPwlModalOpen(true);

        // Fallback to legacy endpoint if you ever need to flip the flag off
        const url = USE_API ? `${API_BASE}${PWL_PATH}` : `${API_BASE}/pwl/additem`;

        try {
            if (!USE_API) {
                // legacy form flow (kept for easy rollback)
                const fd = new FormData();
                fd.append('wineid[]', wine.id);
                const res = await fetch(url, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
                const text = await res.text();
                setPwlResponseData({ success: res.ok, url, wineId: wine.id, response: text.slice(0, 500) });
                return;
            }

            // new JSON API flow
            const res = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                credentials: 'include',  // sends wso_session
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    listid: 'default',
                    wineid: [wine.id],
                    source: 'top100',
                    name: `${wine.winery_full} ${wine.wine_full} ${wine.vintage}`
                })
            });

            if (res.status === 401) {
                setPwlResponseData({ success: false, code: 'AUTH_REQUIRED', message: 'Please sign in to save to PWL.' });
                return;
            }
            if (res.status === 403) {
                setPwlResponseData({ success: false, code: 'PAYWALL_FORBIDDEN', message: 'Subscriber feature. Upgrade to continue.' });
                return;
            }
            if (!res.ok && res.status !== 207) {
                throw new Error(`Request failed: ${res.status}`);
            }

            const data = await res.json();
            const { added = [], errors = [] } = data || {};
            const partial = res.status === 207 || errors.length > 0;

            setPwlResponseData({
                success: !partial,
      partial,
      added,
      errors,
      message: partial
        ? `Added ${added.length} item(s). ${errors.length} issue(s).`
        : 'Added to your Personal Wine List.'
    });

    trackEvent('add_to_pwl', { wine_id: wine.id, wine_name: wine.wine_full, partial, status: res.status });
    } catch (err) {
    console.error('Error adding to PWL:', err);
    setPwlResponseData({ success: false, code: 'NETWORK_ERROR', message: 'We had trouble saving that. Please try again.' });
    }
};

    useEffect(() => {
        // Parse ?year=YYYY from URL on initial load
        const params = new URLSearchParams(window.location.search);
        const yearParam = params.get('year');
        if (yearParam) {
            const y = parseInt(yearParam, 10);
            if (!Number.isNaN(y)) {
                setSelectedYear(y);
            }
        }

        // Track page view
        trackEvent('page_view', { page_title: 'Wine Top 100' });

        // Check for shared wine or list in URL
        const urlParams = new URLSearchParams(window.location.search);
        const sharedWineId = urlParams.get('wine');
        const sharedTastedList = urlParams.get('tasted');

        if (sharedWineId) {
            // Open specific wine
            const wine = wines.find(w => w.id === parseInt(sharedWineId));
            if (wine) {
                setSelectedWine(wine);
                trackEvent('view_shared_wine', { wine_id: sharedWineId });
            }
        }

        if (sharedTastedList) {
            // Import shared tasting list
            const wineIds = sharedTastedList.split(',');
            const newTastingRecord = {};
            wineIds.forEach(id => {
                newTastingRecord[id] = 'tasted';
            });
            setTastingRecord(prevRecord => ({...prevRecord, ...newTastingRecord}));
            trackEvent('view_shared_list', { wine_count: wineIds.length });
            
            // Show a notification
            alert(`Imported ${wineIds.length} wines to your tasting list!`);
            
            // Open the tasting panel to show the imported wines
            setShowTastingPanel(true);
        }
    }, [wines]);

    useEffect(() => {
        localStorage.setItem('tastingRecord', JSON.stringify(tastingRecord));
    }, [tastingRecord]);
    
    // Pagination removed: always show all filtered wines

    const handleTasteChange = (wineId, status) => {
        const wine = wines.find(w => String(w.id) === String(wineId));
        if (wine && status) {
            trackTastingAction(wine, status);
        }
        
        setTastingRecord(prevRecord => {
            const newRecord = { ...prevRecord };
            const key = String(wineId);
            if (status === null) {
                delete newRecord[key];
            } else {
                newRecord[key] = status;
            }
            return newRecord;
        });
    };

    const handleCompareToggle = (wine) => {
        setCompareWines(prev => {
            const isInList = prev.some(w => w.id === wine.id);
            if (isInList) {
                trackEvent('remove_from_comparison', { wine_id: wine.id, wine_name: wine.wine_full });
                return prev.filter(w => w.id !== wine.id);
            } else if (prev.length < 3) {
                trackEvent('add_to_comparison', { wine_id: wine.id, wine_name: wine.wine_full });
                return [...prev, wine];
            }
            return prev;
        });
    };

    const handleRemoveFromComparison = (wineId) => {
        setCompareWines(prev => prev.filter(w => w.id !== wineId));
    };

    const handleCompare = () => {
        if (compareWines.length >= 2) {
            trackEvent('open_comparison', { wine_count: compareWines.length });
            setShowComparisonModal(true);
        }
    };
    
    const handleAddNote = (wineId, note, rating) => {
        // This function will be passed to the WineDetailModal
        // and will handle adding notes to wines
        const wine = wines.find(w => w.id === wineId);
        if (wine) {
            trackEvent('wine_note_added', {
                wine_id: wineId,
                wine_name: wine.wine_full,
                has_rating: rating > 0,
                has_text: note && note.trim().length > 0
            });
        }
    };

    useScrollAnimation();

    // Back-to-top visibility handler
    useEffect(() => {
        const onScroll = () => {
            setShowBackToTop(window.scrollY > 600);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const filteredWines = useMemo(() => {
      return wines.filter(wine => {
          const matchesSearch = !filters.search || 
              wine.wine_full.toLowerCase().includes(filters.search.toLowerCase()) || 
              (wine.winery_full && wine.winery_full.toLowerCase().includes(filters.search.toLowerCase()));
          const matchesColor = filters.color === 'All' || wine.color === filters.color;
          const matchesCountry = filters.country === 'All' || wine.country === filters.country;
          const matchesWineType = filters.wineType === 'All' || wine.wine_type === filters.wineType;
          return matchesSearch && matchesColor && matchesCountry && matchesWineType;
      });
  }, [filters, wines]);

  // Build list with interleaved ad placeholders
  const renderWithAds = (items, condensed) => {
      const out = [];
      const interval = condensed ? 10 : 9; // grid: after every 3 rows (3 cols * 3 rows)
      items.forEach((wine, idx) => {
          out.push(
              <WineCard 
                  key={wine.id} 
                  wine={wine} 
                  onSelect={setSelectedWine} 
                  isCondensed={condensed} 
                  tastingRecord={tastingRecord} 
                  onTasteChange={handleTasteChange}
                  compareWines={compareWines}
                  onCompareToggle={handleCompareToggle}
                  onAddToPWL={handleAddToPWL}
                  selectedYear={selectedYear}
              />
          );
          if ((idx + 1) % interval === 0) {
              out.push(
                  <div className="ad-placeholder" key={`ad-${condensed ? 'list' : 'grid'}-${idx}`}>
                      Advertising placeholder here
                  </div>
              );
          }
      });
      return out;
  };

const currentWines = filteredWines;

return (
    <Fragment>
        <Navigation />
        <main>
            <section id="wines" className="wines-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Wine Spectator's Top 100 Lists</h2>
                        <div className="year-selector-container">
                            <select 
                                value={selectedYear}
                                onChange={(e) => {
                                    const y = parseInt(e.target.value, 10);
                                    setSelectedYear(y);
                                    // Reset all filters to prevent empty results when switching years
                                    setFilters({ search: '', color: 'All', country: 'All', wineType: 'All' });
                                    // Sync ?year= in URL (preserve other params)
                                    const params = new URLSearchParams(window.location.search);
                                    params.set('year', String(y));
                                    const newUrl = `${window.location.pathname}?${params.toString()}`;
                                    window.history.replaceState(null, '', newUrl);
                                }}
                                className="year-selector"
                            >
                                {Array.from({length: 37}, (_, i) => 2024 - i).map(year => (
                                    <option key={year} value={year}>{year} Top 100</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="filter-toggle-row">
                        <div className={`view-segmented ${isCondensed ? 'list-active' : 'grid-active'}`} role="tablist" aria-label="View mode">
                            <button
                                className={`seg ${!isCondensed ? 'active' : ''}`}
                                role="tab"
                                aria-selected={!isCondensed}
                                onClick={() => { if (isCondensed) { setIsCondensed(false); trackEvent('view_mode_changed', { mode: 'grid' }); } }}
                                title="Grid View"
                            >
                                <Icons.Grid className="seg-icon" />
                                <span>Grid</span>
                            </button>
                            <button
                                className={`seg ${isCondensed ? 'active' : ''}`}
                                role="tab"
                                aria-selected={isCondensed}
                                onClick={() => { if (!isCondensed) { setIsCondensed(true); trackEvent('view_mode_changed', { mode: 'list' }); } }}
                                title="List View"
                            >
                                <Icons.List className="seg-icon" />
                                <span>List</span>
                            </button>
                            <span className="seg-thumb" aria-hidden="true" />
                        </div>
                        <button
                            className="btn-modern btn-small filter-toggle-btn"
                            onClick={() => { setShowFilters(v => { const next = !v; trackEvent('filters_visibility_toggled', { visible: next }); return next; }); }}
                            aria-expanded={showFilters}
                            aria-controls="filters-panel"
                        >
                            <span className="toggle-text">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                        </button>
                    </div>

                    {showFilters && (
                        <div id="filters-panel">
                            <FilterBar 
                                filters={filters} 
                                onFiltersChange={setFilters} 
                                currentWines={wines} 
                            />
                        </div>
                    )}
                    <div id="wine-list-container" className="wine-list-container">
                        {isLoading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Loading {selectedYear} vintage...</p>
                            </div>
                        ) : (
                            isCondensed ? (
                                <div className="wine-list-condensed">
                                    {renderWithAds(currentWines, true)}
                                </div>
                            ) : (
                                <div className="wine-grid">
                                    {renderWithAds(currentWines, false)}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </section>
        </main>
            
        {/* PWL Response modal */}
        <PWLResponseModal
            isOpen={pwlModalOpen}
            onClose={() => setPwlModalOpen(false)}
            wineName={pwlWineName}
            responseData={pwlResponseData}
        />

            {/* Back to Top Button */}
            {showBackToTop && (
                <button
                    className="back-to-top"
                    onClick={scrollToTop}
                    aria-label="Back to top"
                >
                    <Icons.ArrowUp className="back-to-top-icon" />
                    Back to Top
                </button>
            )}
            
            {/* Wine detail modal */}
            {selectedWine && (
                <WineDetailModal 
                    wine={selectedWine} 
                    isOpen={!!selectedWine} 
                    onClose={() => setSelectedWine(null)}
                    tastingRecord={tastingRecord}
                    onTasteChange={handleTasteChange}
                    onAddNote={handleAddNote}
                />
            )}
            
            <TastingTrackerPanel 
                isOpen={showTastingPanel}
                onToggle={() => setShowTastingPanel(!showTastingPanel)}
                tastingRecord={tastingRecord}
                wines={wines}
                onTasteChange={handleTasteChange}
                selectedYear={selectedYear}
            />

            {/* Comparison bar & modal */}
            <ComparisonBar 
                compareWines={compareWines}
                onRemove={handleRemoveFromComparison}
                onCompare={handleCompare}
            />
            <ComparisonModal 
                wines={compareWines}
                isOpen={showComparisonModal}
                onClose={() => setShowComparisonModal(false)}
            />
            <Footer />
        </Fragment>
    );
};

export default App;
