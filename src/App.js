import React, { useState, useEffect, useMemo, useRef, Fragment } from 'react';
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

const trackSearch = (searchTerm, resultsCount) => {
    trackEvent('search', {
        search_term: searchTerm,
        results_count: resultsCount
    });
};

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

const wines = winesData.map((wine, index) => ({
    id: parseInt(wine.top100_rank, 10) || index + 1,
    rank: parseInt(wine.top100_rank, 10) || 0,
    name: wine.wine_full || 'Unnamed Wine',
    winery: wine.winery_full || 'Unknown Winery',
    image: wine.label_url || '',
    varietal: wine.varietal || 'N/A',
    vintage: parseInt(wine.vintage, 10) || 'N/A',
    region: wine.region || 'Unknown Region',
    country: wine.country || 'Unknown Country',
    type: wine.color || 'N/A',
    score: parseInt(wine.score, 10) || 0,
    price: parseFloat(String(wine.price || "0").replace('$', '')),
    description: wine.note || 'No description available.',
}));

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

// Welcome Popup Component
const WelcomePopup = ({ isOpen, onClose }) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);
    
    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem('hideWelcomePopup', 'true');
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="welcome-popup-overlay">
            <div className="welcome-popup-backdrop" onClick={handleClose} />
            <div className="welcome-popup-content">
                <button onClick={handleClose} className="welcome-popup-close">
                    <Icons.X className="icon-close" />
                </button>
                
                <div className="welcome-popup-header">
                    <div className="welcome-popup-logo">
                        <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Wine Spectator Logo" />
                    </div>
                    <h2>About The Top 100</h2>
                </div>
                
                <div className="welcome-popup-body">
                    <p>
                        Each year since 1988, <em>Wine Spectator</em> has released its Top 100 list, where our editors select the most exciting wines from the thousands we reviewed during the course of the year. These wines are a diverse group—ranging from emerging labels and regions to traditional estates exploring new directions—and all generate the excitement we call the "X-factor."
                    </p>
                    
                    <p>
                        In addition, our selection also prioritizes quality (based on score), value (based on price) and availability (based on the number of cases either made or imported into the United States). These criteria are applied to the wines that rated outstanding (90 points or higher on <em>Wine Spectator</em>'s 100-point scale) each year to determine our Top 100.
                    </p>
                    
                    <p>
                        As many wines are made in limited quantities and not available in every market, our Top 100 is not a "shopping list," but rather a guide to wineries to watch in the future—a reflection of the producers and wines our editors become particularly passionate about in each new year.
                    </p>
                </div>
                
                <div className="welcome-popup-footer">
                    <label className="welcome-popup-checkbox">
                        <input 
                            type="checkbox" 
                            checked={dontShowAgain}
                            onChange={(e) => setDontShowAgain(e.target.checked)}
                        />
                        <span>Don't show me again</span>
                    </label>
                    
                    <button onClick={handleClose} className="btn-modern">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Export Button Component
const ExportButton = ({ tastingRecord, wines }) => {
    const [showMenu, setShowMenu] = useState(false);
    
    const exportTastingList = (format) => {
        const data = Object.entries(tastingRecord).map(([wineId, status]) => {
            const wine = wines.find(w => String(w.id) === String(wineId));
            return {
                Rank: wine.top100_rank ? parseInt(wine.top100_rank, 10) : 0,
                Wine: wine.wine_full,
                Winery: wine.winery_full,
                Vintage: wine.vintage,
                Type: wine.color,
                Region: wine.region,
                Country: wine.country,
                Status: status === 'tasted' ? 'Tasted' : 'Want to Taste',
                Score: wine.score,
                Price: `$${wine.price}`
            };
        });

        if (format === 'csv') {
            const csv = [
                Object.keys(data[0]).join(','),
                ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wine-tasting-list-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } else if (format === 'json') {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wine-tasting-list-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        trackExport(format, data.length);
        setShowMenu(false);
    };

    const itemCount = Object.keys(tastingRecord).length;
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
    
    return (
        <label className="tasting-checkbox">
            <input 
                type="checkbox" 
                checked={isChecked} 
                onChange={handleChange} 
            />
            <span>{status === 'tasted' ? 'I have tasted this' : 'I want to taste this'}</span>
        </label>
    );
};


// Share Tasting List Component
const ShareTastingList = ({ tastingRecord, wines }) => {
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

    const generateShareLink = () => {
        const tastedWineIds = Object.entries(tastingRecord)
            .filter(([_, status]) => status === 'tasted')
            .map(([wineId, _]) => wineId)
            .join(',');
        
        const link = `${window.location.origin}${window.location.pathname}?tasted=${tastedWineIds}`;
        setShareLink(link);
        setShowShareModal(true);
        trackEvent('share_tasting_list', { wine_count: tastedWineIds.split(',').length });
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

    const itemCount = Object.keys(tastingRecord).length;
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
                                <li>{Object.entries(tastingRecord).filter(([_, status]) => status === 'tasted').length} wines tasted</li>
                                <li>{Object.entries(tastingRecord).filter(([_, status]) => status === 'want').length} wines to try</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
// Tasting Tracker Side Panel Component
const TastingTrackerPanel = ({ isOpen, onToggle, tastingRecord, wines, onTasteChange }) => {
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

    return (
        <>
            {/* Fixed Tab Button */}
            <button 
                className={`tasting-tracker-tab ${isOpen ? 'tab-open' : ''}`}
                onClick={onToggle}
            >
                <span className="tab-text">My Tastings</span>
                <span className="tab-count">{totalCount}</span>
            </button>

            {/* Sliding Panel */}
            <div className={`tasting-tracker-panel ${isOpen ? 'panel-open' : ''}`}>
                <div className="panel-header">
                    <h3>My Wine Journey</h3>
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
                                            <div className="mini-wine-image">
                                                <Icons.Wine className="wine-placeholder" />
                                            </div>
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
                                            <div className="mini-wine-image">
                                                <Icons.Wine className="wine-placeholder" />
                                            </div>
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
                        <ExportButton tastingRecord={tastingRecord} wines={wines} />
                        <ShareTastingList tastingRecord={tastingRecord} wines={wines} />
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
                                <div className="comparison-thumb">
                                    <Icons.Wine className="wine-placeholder" />
                                </div>
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
                                        <div className="comparison-wine-image">
                                            <Icons.Wine className="wine-placeholder" />
                                        </div>
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


const WineCard = ({ wine, onSelect, compareWines, onCompareToggle, tastingRecord, onTasteChange, isCondensed, onAddToPWL }) => {
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
                    <Icons.Wine className="wine-placeholder" />
                )}
                </div>
                <div className="wine-info-condensed" onClick={() => { console.log('[WineCard] onSelect (condensed info) clicked', { id: wine.id, name: wine.wine_full }); onSelect(wine); }}>
                    <h3>{wine.wine_full}</h3>
                    <p>{wine.winery_full}</p>
                    <div className="tasting-options-condensed">
                        <TastingCheckbox wineId={wine.id} tastingRecord={tastingRecord} onTasteChange={onTasteChange} status="tasted" />
                        <TastingCheckbox wineId={wine.id} tastingRecord={tastingRecord} onTasteChange={onTasteChange} status="want" />
                    </div>
                </div>
                <div className="wine-details-condensed">
                    <div className="price-score-row">
                        <span className="wine-score-condensed">{score} pts</span>
                        <button
                            className="btn-pwl btn-pwl-small"
                            onClick={() => onAddToPWL(wine)}
                        >
                            Add to PWL
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                    <Icons.Wine className="wine-placeholder" />
                )}
            </div>
            <div className="wine-content">
                <div className="wine-header">
                    <h3 className="wine-winery-name" onClick={() => { console.log('[WineCard] onSelect (winery) clicked', { id: wine.id, name: wine.wine_full }); onSelect(wine); }}>{wine.winery_full}</h3>
                    <h2 className="wine-name" onClick={() => { console.log('[WineCard] onSelect (name) clicked', { id: wine.id, name: wine.wine_full }); onSelect(wine); }}>{wine.wine_full}</h2>
                </div>
                <div className="wine-metadata">
                    <div className="wine-tags">
                        <span className="wine-tag">{wine.vintage}</span>
                        <span className={`wine-tag ${getTypeColor(wine.color)}`}>{wine.color}</span>
                        <span className="wine-tag">{wine.region || 'Unknown Region'}</span>
                    </div>
                    <div className="tasting-options">
                        <TastingCheckbox wineId={wine.id} tastingRecord={tastingRecord} onTasteChange={onTasteChange} status="tasted" />
                        <TastingCheckbox wineId={wine.id} tastingRecord={tastingRecord} onTasteChange={onTasteChange} status="want" />
                    </div>
                    <div className="wine-footer">
                        <button className="btn-modern btn-small" onClick={() => { console.log('[WineCard] View Details clicked', { id: wine.id, name: wine.wine_full }); onSelect(wine); trackEvent('view_details_clicked', { wineId: wine.id }); }}>View Details</button>
                        <button 
                            className="btn-pwl"
                            onClick={() => onAddToPWL(wine)}
                        >
                            Add to PWL
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
                            <div className="pwl-response">
                                <p><strong>Wine ID:</strong> {responseData.wineId}</p>
                                <div className="response-preview">
                                    <p><strong>Response Preview:</strong></p>
                                    <pre>{responseData.response}</pre>
                                </div>
                            </div>
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
                            <Icons.Wine className="wine-placeholder-large" />
                        )}
                    </div>
                    <div className="wine-detail-info">
                        <h2>{wine.winery_full}</h2>
                        <p className="wine-subtitle">{wine.wine_full} {wine.vintage}</p>
                        <div className="wine-tags">
                            <span className="wine-tag">{wine.country}</span>
                            <span className="wine-tag">{wine.region || 'Unknown Region'}</span>
                            <span className="wine-tag type-tag">{wine.color}</span>
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
    
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`navbar-modern ${scrolled ? 'scrolled' : ''}`}>
            <div className="navbar-container">
                <a href="https://www.winespectator.com" className="logo-container">
                    <div className="logo-background" style={{ backgroundColor: scrolled ? 'white' : 'rgba(0, 0, 0, 0.6)' }}>
                        <img 
                            src={process.env.PUBLIC_URL + (scrolled ? '/logo-black.png' : '/logo.png')} 
                            alt="Wine Spectator Logo" 
                            className="navbar-logo"
                        />
                    </div>
                </a>
                <div className="navbar-menu">
                    <a href="https://top100.winespectator.com" className={scrolled ? 'nav-link-dark' : 'nav-link-light'}>Top 100</a>
                    <a href="https://www.winespectator.com/subscribe"><button className="btn-modern">Subscribe</button></a>
                </div>
            </div>
        </nav>
    );
};


const FilterBar = ({ filters, onFiltersChange, isCondensed, onViewChange, currentWines }) => {
    const allTypes = [...new Set(currentWines.map(wine => wine.color))].filter(Boolean);
    const allCountries = [...new Set(currentWines.map(wine => wine.country))].filter(Boolean);
    
    const handleFilterChange = (filterType, value) => {
        onFiltersChange({ ...filters, [filterType]: value });
        trackFilterUse(filterType, value);
    };

    return (
        <div className="filter-bar">
            <div className="filter-row">
                {/* Search removed per request; relying on clickable filters only */}
                <div className="filter-section">
                    <p className="filter-label">View</p>
                    <div className="filter-buttons">
                        <button 
                            onClick={() => { onViewChange(false); trackEvent('view_mode_changed', { mode: 'grid' }); }} 
                            className={!isCondensed ? 'filter-btn active' : 'filter-btn'}
                        >
                            As Grid
                        </button>
                        <button 
                            onClick={() => { onViewChange(true); trackEvent('view_mode_changed', { mode: 'list' }); }} 
                            className={isCondensed ? 'filter-btn active' : 'filter-btn'}
                        >
                            As List
                        </button>
                    </div>
                </div>
            </div>
            <div className="filter-section">
                <p className="filter-label">Wine Type</p>
                <div className="filter-buttons">
                    {['All', ...allTypes].map(type => (
                        <button 
                            key={type} 
                            onClick={() => handleFilterChange('type', type)} 
                            className={filters.type === type ? 'filter-btn active' : 'filter-btn'}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>
            <div className="filter-section">
                <p className="filter-label">Country</p>
                <div className="filter-buttons">
                    {['All', ...allCountries].map(country => (
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
    );
};

const Footer = () => (
    <footer className="footer">
        <div className="footer-container">
            <div className="footer-grid">
                <div className="footer-section">
                    <img src={process.env.PUBLIC_URL + '/logo.png'} alt="Wine Spectator Logo" className="footer-logo" />
                    <p>Curating the world's finest wines since 1976.</p>
                </div>
                <div className="footer-section">
                    <h4>Follow Us</h4>
                    <div className="social-links">
                        <a href="https://twitter.com/WineSpectator" target="_blank" rel="noopener noreferrer" className="social-icon-container">
                            <img src={process.env.PUBLIC_URL + '/X.png'} alt="X Social Icon" className="social-icon" />
                        </a>
                        <a href="https://facebook.com/WineSpectator" target="_blank" rel="noopener noreferrer" className="social-icon-container">
                            <img src={process.env.PUBLIC_URL + '/FB.png'} alt="Facebook Social Icon" className="social-icon" />
                        </a>
                        <a href="https://instagram.com/winespectator" target="_blank" rel="noopener noreferrer" className="social-icon-container">
                            <img src={process.env.PUBLIC_URL + '/IG.png'} alt="Instagram Social Icon" className="social-icon" />
                        </a>
                    </div>
                </div>
                <div className="footer-section">
                    <h4>Resources</h4>
                    <ul>
                        <li><a href="https://www.winespectator.com/wine/search" target="_blank" rel="noopener noreferrer">Wine Ratings Search</a></li>
                        <li><a href="https://www.winespectator.com/vintage-charts" target="_blank" rel="noopener noreferrer">Vintage Charts</a></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h4>Stay Updated</h4>
                    <p><a href="https://www.winespectator.com/newsletter">Subscribe to our newsletter.</a></p>
                </div>
            </div>
            <div className="footer-bottom">
                <p> 2024 Wine Spectator. All rights reserved.</p>
            </div>
        </div>
    </footer>
);

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
    const [filters, setFilters] = useState({ search: '', type: 'All', country: 'All' });
    const [isCondensed, setIsCondensed] = useState(false);
    const [showWelcomePopup, setShowWelcomePopup] = useState(false);
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
    
    // Handle Add to PWL button click
    const handleAddToPWL = (wine) => {
        // Set the wine name for display in the modal
        setPwlWineName(wine.wine_full);
        
        // Reset response data and open modal
        setPwlResponseData(null);
        setPwlModalOpen(true);
        
        // Construct the URL
        const url = 'https://www.winespectator.com/pwl/additem';
        
        // Create form data for the payload
        const formData = new FormData();
        formData.append('wineid[]', wine.id);
        
        // Make the POST request
        fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                // Set the response data
                setPwlResponseData({ 
                    success: true, 
                    url, 
                    wineId: wine.id,
                    response: data.substring(0, 500) + (data.length > 500 ? '...' : '') 
                });
                
                // Track the event
                trackEvent('add_to_pwl', { wine_id: wine.id, wine_name: wine.wine_full });
            })
            .catch(error => {
                console.error('Error adding to PWL:', error);
                setPwlResponseData({ 
                    success: false, 
                    error: error.message, 
                    url,
                    wineId: wine.id 
                });
            });
    };

    useEffect(() => {
        // Check if welcome popup should be shown
        const hidePopup = localStorage.getItem('hideWelcomePopup');
        if (!hidePopup) {
            setShowWelcomePopup(true);
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
            const matchesType = filters.type === 'All' || wine.color === filters.type;
            const matchesCountry = filters.country === 'All' || wine.country === filters.country;
            return matchesSearch && matchesType && matchesCountry;
        });
    }, [filters, wines]);

    const currentWines = filteredWines;

    return (
        <Fragment>
            <Navigation />
            <main>
                <section id="wines" className="wines-section">
                    <div className="container">
                        <div className="section-header">
                            <h2>Wine Spectator's Top 100 Lists</h2>
                            <p>Discover the finest wines from around the world</p>
                            <div className="year-selector-container">
                                <select 
                                    value={selectedYear}
                                    onChange={(e) => {
                                        setSelectedYear(parseInt(e.target.value));
                                        // Reset all filters to prevent empty results when switching years
                                        setFilters({ search: '', type: 'All', country: 'All' });
                                    }}
                                    className="year-selector"
                                >
                                    {Array.from({length: 37}, (_, i) => 2024 - i).map(year => (
                                        <option key={year} value={year}>
                                            {year} Vintage
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <FilterBar 
                            filters={filters} 
                            onFiltersChange={setFilters} 
                            isCondensed={isCondensed}
                            currentWines={wines} 
                            onViewChange={setIsCondensed} 
                        />
                        <div id="wine-list-container" className="wine-list-container">
                            {isLoading ? (
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                    <p>Loading {selectedYear} vintage...</p>
                                </div>
                            ) : (
                                isCondensed ? (
                                    <div className="wine-list-condensed">
                                        {currentWines.map((wine) => (
                                            <WineCard 
                                                key={wine.id} 
                                                wine={wine} 
                                                onSelect={setSelectedWine} 
                                                isCondensed={true} 
                                                tastingRecord={tastingRecord} 
                                                onTasteChange={handleTasteChange}
                                                compareWines={compareWines}
                                                onCompareToggle={handleCompareToggle}
                                                onAddToPWL={handleAddToPWL}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="wine-grid">
                                        {currentWines.map((wine) => (
                                            <WineCard 
                                                key={wine.id} 
                                                wine={wine} 
                                                onSelect={setSelectedWine} 
                                                isCondensed={false} 
                                                tastingRecord={tastingRecord} 
                                                onTasteChange={handleTasteChange}
                                                compareWines={compareWines}
                                                onCompareToggle={handleCompareToggle}
                                                onAddToPWL={handleAddToPWL}
                                            />
                                        ))}
                                    </div>
                                )
                            )}
                            
                            {/* Pagination removed: showing all wines */}
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

            {/* Welcome popup */}
            <WelcomePopup 
                isOpen={showWelcomePopup}
                onClose={() => setShowWelcomePopup(false)}
            />

            {/* Footer */}
            <Footer />
        </Fragment>
    );
};

export default App;
