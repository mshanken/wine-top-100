import React, { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import './App.css';
import winesData from './data/wines-2024.json';

// Lazy Loading Image Component - SIMPLIFIED VERSION
const LazyImage = ({ src, alt, className, placeholderSrc = '/placeholder-wine.jpg' }) => {
    const [imageSrc, setImageSrc] = useState(placeholderSrc);
    const [imageLoading, setImageLoading] = useState(true);

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            setImageSrc(src);
            setImageLoading(false);
        };
    }, [src]);

    return (
        <div className={className} style={{ position: 'relative' }}>
            {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="spinner"></div>
                </div>
            )}
            <img 
                src={imageSrc} 
                alt={alt} 
                className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            />
        </div>
    );
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
            const wine = wines.find(w => w.id === parseInt(wineId));
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
    const isChecked = tastingRecord[wineId] === status;
    const handleChange = () => onTasteChange(wineId, isChecked ? null : status);
    
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

// Share Button Component
const ShareButton = ({ wine }) => {
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    const shareUrl = `${window.location.origin}${window.location.pathname}?wine=${wine.id}`;
    const shareText = `Check out this amazing wine: ${wine.wine_full} from ${wine.winery_full} (${wine.vintage}) - Rated ${wine.score} points!`;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            trackEvent('share_wine', { method: 'copy_link', wine_id: wine.id });
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const shareToTwitter = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank');
        trackEvent('share_wine', { method: 'twitter', wine_id: wine.id });
    };

    const shareToFacebook = () => {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(facebookUrl, '_blank');
        trackEvent('share_wine', { method: 'facebook', wine_id: wine.id });
    };

    return (
        <div className="share-button-container">
            <button 
                className="btn-modern share-button"
                onClick={() => setShowShareMenu(!showShareMenu)}
            >
                <span className="share-icon">🔗</span>
                Share This Wine
            </button>
            
            {showShareMenu && (
                <div className="share-menu">
                    <button onClick={copyToClipboard} className="share-option">
                        {copied ? '✓ Copied!' : '📋 Copy Link'}
                    </button>
                    <button onClick={shareToTwitter} className="share-option">
                        𝕏 Share on X
                    </button>
                    <button onClick={shareToFacebook} className="share-option">
                        f Share on Facebook
                    </button>
                </div>
            )}
        </div>
    );
};

// Share Tasting List Component
const ShareTastingList = ({ tastingRecord, wines }) => {
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareLink, setShareLink] = useState('');
    const [copied, setCopied] = useState(false);

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

// Personal Notes Component
const PersonalNotes = ({ wineId, wineName }) => {
    const [notes, setNotes] = useState(() => {
        const saved = localStorage.getItem(`wine-notes-${wineId}`);
        return saved ? JSON.parse(saved) : [];
    });
    const [newNote, setNewNote] = useState('');
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    const saveNote = () => {
        if (!newNote.trim() && rating === 0) return;

        const note = {
            id: Date.now(),
            text: newNote,
            rating: rating,
            date: new Date().toISOString(),
        };

        const updatedNotes = [note, ...notes];
        setNotes(updatedNotes);
        localStorage.setItem(`wine-notes-${wineId}`, JSON.stringify(updatedNotes));
        
        // Reset form
        setNewNote('');
        setRating(0);

        // Track the event
        trackEvent('wine_note_added', {
            wine_id: wineId,
            wine_name: wineName,
            has_rating: rating > 0,
            has_text: newNote.trim().length > 0
        });
    };

    const deleteNote = (noteId) => {
        const updatedNotes = notes.filter(note => note.id !== noteId);
        setNotes(updatedNotes);
        localStorage.setItem(`wine-notes-${wineId}`, JSON.stringify(updatedNotes));
    };

    const StarRating = ({ interactive = true }) => {
        const currentRating = interactive ? (hoverRating || rating) : rating;
        
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`star ${star <= currentRating ? 'filled' : ''}`}
                        onClick={() => interactive && setRating(star)}
                        onMouseEnter={() => interactive && setHoverRating(star)}
                        onMouseLeave={() => interactive && setHoverRating(0)}
                        disabled={!interactive}
                    >
                        ★
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="personal-notes">
            <h4>My Tasting Notes</h4>
            
            {/* Add new note form */}
            <div className="add-note-form">
                <div className="rating-section">
                    <label>My Rating:</label>
                    <StarRating />
                </div>
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add your tasting notes, food pairings, or memories..."
                    rows="4"
                    className="note-textarea"
                />
                <button 
                    onClick={saveNote}
                    className="btn-modern btn-small"
                    disabled={!newNote.trim() && rating === 0}
                >
                    Save Note
                </button>
            </div>

            {/* Display existing notes */}
            {notes.length > 0 && (
                <div className="notes-history">
                    <h5>Previous Notes</h5>
                    {notes.map(note => (
                        <div key={note.id} className="note-item">
                            <div className="note-header">
                                <span className="note-date">
                                    {new Date(note.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                                {note.rating > 0 && (
                                    <div className="note-rating">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className={`star ${i < note.rating ? 'filled' : ''}`}>
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <button 
                                    onClick={() => deleteNote(note.id)}
                                    className="note-delete"
                                    title="Delete note"
                                >
                                    <Icons.X className="icon-small" />
                                </button>
                            </div>
                            {note.text && <p className="note-text">{note.text}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
// Tasting Tracker Side Panel Component
const TastingTrackerPanel = ({ isOpen, onToggle, tastingRecord, wines, onTasteChange }) => {
    const tastedWines = [];
    const wantToTasteWines = [];
    
    // Organize wines by status
    Object.entries(tastingRecord).forEach(([wineId, status]) => {
        const wine = wines.find(w => w.id === parseInt(wineId));
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
                                        <img 
                                            src={wine.label_url || '/placeholder-wine.jpg'} 
                                            alt={wine.wine_full}
                                            className="mini-wine-image"
                                        />
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
                                        <img 
                                            src={wine.label_url || '/placeholder-wine.jpg'} 
                                            alt={wine.wine_full}
                                            className="mini-wine-image"
                                        />
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
                            <img src={wine.label_url || '/placeholder-wine.jpg'} alt={wine.wine_full} />
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
                                    <img 
                                        src={wine.label_url || '/placeholder-wine.jpg'} 
                                        alt={wine.wine_full}
                                        className="comparison-wine-image"
                                    />
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

// Enhanced Search Component
const EnhancedSearch = ({ wines, onSearch, filters }) => {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef(null);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentWineSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Save search to recent searches
    const saveRecentSearch = (term) => {
        if (!term.trim()) return;
        const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentWineSearches', JSON.stringify(updated));
    };

    // Search function
    const searchWines = (term) => {
        if (!term.trim()) return [];
        
        const searchLower = term.toLowerCase();
        return wines.filter(wine => {
            return (
                (wine.wine_full && wine.wine_full.toLowerCase().includes(searchLower)) ||
                (wine.winery_full && wine.winery_full.toLowerCase().includes(searchLower)) ||
                (wine.region && wine.region.toLowerCase().includes(searchLower)) ||
                (wine.country && wine.country.toLowerCase().includes(searchLower)) ||
                (wine.vintage && wine.vintage.toString().includes(searchLower))
            );
        }).slice(0, 8); // Limit to 8 suggestions
    };

    // Handle input change
    const handleInputChange = (value) => {
        setSearchTerm(value);
        setSelectedIndex(-1);
        
        if (value.trim()) {
            const results = searchWines(value);
            setSuggestions(results);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
        
        onSearch({ ...filters, search: value });
        
        if (value) {
            trackSearch(value, suggestions.length);
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (wine) => {
        setSearchTerm(wine.wine_full);
        setShowSuggestions(false);
        saveRecentSearch(wine.wine_full);
        onSearch({ ...filters, search: wine.wine_full });
        trackEvent('search_suggestion_clicked', { wine_id: wine.id, wine_name: wine.wine_full });
    };

    // Handle recent search click
    const handleRecentSearchClick = (term) => {
        setSearchTerm(term);
        handleInputChange(term);
        trackEvent('recent_search_clicked', { search_term: term });
    };

    // Clear recent searches
    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentWineSearches');
    };

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (!showSuggestions) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    handleSuggestionClick(suggestions[selectedIndex]);
                } else if (searchTerm.trim()) {
                    saveRecentSearch(searchTerm);
                    setShowSuggestions(false);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                break;
            default:
                // Do nothing for other keys
                break;
        }
    };

    return (
        <div className="enhanced-search" ref={searchRef}>
            <div className="search-input-wrapper">
                <Icons.Search className="search-icon" />
                <input
                    type="text"
                    placeholder="Search wines, wineries, regions..."
                    value={searchTerm}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    className="enhanced-search-input"
                />
                {searchTerm && (
                    <button
                        className="search-clear"
                        onClick={() => handleInputChange('')}
                    >
                        <Icons.X className="icon-small" />
                    </button>
                )}
            </div>

            {showSuggestions && (
                <div className="search-dropdown">
                    {/* Recent Searches */}
                    {!searchTerm && recentSearches.length > 0 && (
                        <div className="search-section">
                            <div className="search-section-header">
                                <span>Recent Searches</span>
                                <button 
                                    className="clear-recent"
                                    onClick={clearRecentSearches}
                                >
                                    Clear
                                </button>
                            </div>
                            {recentSearches.map((search, index) => (
                                <div
                                    key={index}
                                    className="recent-search-item"
                                    onClick={() => handleRecentSearchClick(search)}
                                >
                                    <Icons.Search className="icon-small" />
                                    <span>{search}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Search Suggestions */}
                    {searchTerm && suggestions.length > 0 && (
                        <div className="search-section">
                            <div className="search-section-header">
                                <span>Suggestions</span>
                                <span className="result-count">{suggestions.length} results</span>
                            </div>
                            {suggestions.map((wine, index) => (
                                <div
                                    key={wine.id}
                                    className={`suggestion-item ${selectedIndex === index ? 'selected' : ''}`}
                                    onClick={() => handleSuggestionClick(wine)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <img 
                                        src={wine.label_url || '/placeholder-wine.jpg'} 
                                        alt={wine.wine_full}
                                        className="suggestion-image"
                                    />
                                    <div className="suggestion-info">
                                        <div className="suggestion-name">{wine.wine_full}</div>
                                        <div className="suggestion-details">
                                            {wine.winery_full} • {wine.vintage} • {wine.region || 'Unknown Region'}
                                        </div>
                                        <div className="suggestion-meta">
                                            <span className="suggestion-price">${wine.price}</span>
                                            <span className="suggestion-score">{wine.score} pts</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {searchTerm && suggestions.length === 0 && (
                        <div className="search-no-results">
                            <Icons.Search className="no-results-icon" />
                            <p>No wines found for "{searchTerm}"</p>
                            <span>Try searching by winery, region, or vintage</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Pagination = ({ winesPerPage, totalWines, paginate, currentPage }) => {
    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(totalWines / winesPerPage); i++) {
        pageNumbers.push(i);
    }

    if (pageNumbers.length <= 1) return null;

    return (
        <nav className="pagination">
            <ul>
                {pageNumbers.map(number => (
                    <li key={number}>
                        <button 
                            onClick={() => paginate(number)} 
                            className={currentPage === number ? 'active' : ''}
                        >
                            {number}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

const WineCard = ({ wine, onSelect, tastingRecord, onTasteChange, compareWines, onCompareToggle, isCondensed }) => {
    const isInComparison = compareWines.some(w => w.id === wine.id);
    
    // Extract rank from the top100_rank property or use the id as fallback
    const rank = wine.top100_rank ? parseInt(wine.top100_rank, 10) : parseInt(wine.id, 10);
    
    // Extract price and score with fallbacks
    const price = wine.price || 0;
    const score = wine.score || 0;

    const getRankColor = () => {
        const color = wine.color ? wine.color.toLowerCase() : '';
        if (color === 'red') return 'rank-red';
        if (color === 'white') return 'rank-white';
        if (color === 'rosé' || color === 'rose') return 'rank-rose';
        if (color === 'sparkling') return 'rank-sparkling';
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
                <div className={`wine-rank-condensed ${getRankColor()}`}>{rank}</div>
                <div className="wine-image-condensed" onClick={() => onSelect(wine)}>
                    <LazyImage src={wine.label_url || ''} alt={wine.wine_full} className="wine-bottle-image" />
                </div>
                <div className="wine-info-condensed" onClick={() => onSelect(wine)}>
                    <h3>{wine.wine_full}</h3>
                    <p>{wine.winery_full}</p>
                    <div className="tasting-options-condensed">
                        <TastingCheckbox wineId={wine.id} tastingRecord={tastingRecord} onTasteChange={onTasteChange} status="tasted" />
                        <TastingCheckbox wineId={wine.id} tastingRecord={tastingRecord} onTasteChange={onTasteChange} status="want" />
                    </div>
                </div>
                <div className="wine-details-condensed">
                    <div className="price-score-row">
                        <span className="wine-price">${price}</span>
                        <span className="wine-score-condensed">{score} pts</span>
                    </div>
                    <button
                        className={`compare-btn-small ${isInComparison ? 'active' : ''}`}
                        onClick={() => onCompareToggle(wine)}
                        title={isInComparison ? 'Remove from comparison' : 'Add to comparison'}
                    >
                        <Icons.Compare className="icon-small" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="wine-card-modern">
            <div className={`wine-rank ${getRankColor()}`}>{rank}</div>
            <div className="wine-score-badge">
                <span className="score-value">{score}</span>
                <span className="score-label">points</span>
            </div>
            {isInComparison && (
                <div className="comparison-badge">
                    <Icons.Check className="icon-small" />
                </div>
            )}
            <div className="wine-image" onClick={() => onSelect(wine)}>
                {wine.label_url ? (
                    <LazyImage 
                        src={wine.label_url} 
                        alt={`Bottle of ${wine.wine_full}`} 
                        className="wine-bottle-image" 
                    />
                ) : (
                    <Icons.Wine className="wine-placeholder" />
                )}
            </div>
            <div className="wine-content">
                <div>
                    <h3 onClick={() => onSelect(wine)}>{wine.wine_full}</h3>
                    <p className="wine-winery" onClick={() => onSelect(wine)}>{wine.winery_full}</p>
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
                        <span className="wine-price-large">${price}</span>
                        <div className="wine-actions">
                            <button className="btn-modern btn-small" onClick={() => onSelect(wine)}>View Details</button>
                            <button 
                                className={`btn-compare ${isInComparison ? 'active' : ''}`}
                                onClick={() => onCompareToggle(wine)}
                                disabled={!isInComparison && compareWines.length >= 3}
                                title={isInComparison ? 'Remove from comparison' : 'Add to comparison'}
                            >
                                <Icons.Compare className="icon-small" />
                                {isInComparison ? 'Remove' : 'Compare'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WineDetailModal = ({ wine, isOpen, onClose, tastingRecord, onTasteChange }) => {
    useEffect(() => {
        if (isOpen && wine) {
            trackWineView(wine);
        }
    }, [isOpen, wine]);

    if (!isOpen || !wine) return null;
    
    // Extract rank from the top100_rank property or use the id as fallback
    const rank = wine.top100_rank ? parseInt(wine.top100_rank, 10) : parseInt(wine.id, 10);
    
    // Extract price and score with fallbacks
    const price = wine.price || 0;
    const score = wine.score || 0;

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose} />
            <div className="modal-content wine-detail-modal">
                <button onClick={onClose} className="modal-close">
                    <Icons.X className="icon-close" />
                </button>
                <div className="wine-detail-grid">
                    <div className="wine-detail-image">
                        {wine.label_url ? (
                            <img src={wine.label_url} alt={`Bottle of ${wine.wine_full}`} />
                        ) : (
                            <Icons.Wine className="wine-placeholder-large" />
                        )}
                    </div>
                    <div className="wine-detail-info">
                        <h2>{wine.wine_full}</h2>
                        <p className="wine-subtitle">{wine.winery_full} • {wine.vintage}</p>
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
                            <span className="wine-price-xl">${price}</span>
                            <span className="wine-score-xl">{score} Points</span>
                        </div>
                        
                        {/* Add Share Button */}
                        <ShareButton wine={wine} />
                    </div>
                </div>
                
                {/* Add Personal Notes Section */}
                <div className="wine-detail-notes">
                    <PersonalNotes wineId={wine.id} wineName={wine.wine_full} />
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
                <a href="/">
                    <img 
                        src={process.env.PUBLIC_URL + (scrolled ? '/logo-black.png' : '/logo.png')} 
                        alt="Wine Spectator Logo" 
                        className="navbar-logo"
                    />
                </a>
                <div className="navbar-menu">
                    <a href="#wines" className={scrolled ? 'nav-link-dark' : 'nav-link-light'}>Top 100</a>
                    <button className="btn-modern">Subscribe</button>
                </div>
            </div>
        </nav>
    );
};

const Hero = () => (
    <section className="hero-modern">
        <div className="hero-overlay" />
        <div 
            className="hero-image"
            style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url(${process.env.PUBLIC_URL}/placeholder-wine.jpg)`
            }}
        ></div>
        <div className="hero-content">
            <h1 className="hero-title stagger-in">
                <span className="hero-title-line">Top 100</span>
                <span className="hero-title-line">Wines of 2024</span>
            </h1>
            <p className="hero-subtitle stagger-in">A curated selection of the world's finest wines.</p>
            <a href="#wines" className="btn-modern btn-hero stagger-in">Explore The List</a>
        </div>
    </section>
);

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
                <EnhancedSearch 
                    wines={wines}
                    onSearch={onFiltersChange}
                    filters={filters}
                />
                <div className="view-toggle">
                    <button 
                        onClick={() => { onViewChange(false); trackEvent('view_mode_changed', { mode: 'grid' }); }} 
                        className={!isCondensed ? 'view-btn active' : 'view-btn'}
                    >
                        <Icons.Grid className="view-icon" />
                    </button>
                    <button 
                        onClick={() => { onViewChange(true); trackEvent('view_mode_changed', { mode: 'list' }); }} 
                        className={isCondensed ? 'view-btn active' : 'view-btn'}
                    >
                        <Icons.List className="view-icon" />
                    </button>
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
                        <li><a href="https://www.wine.com" target="_blank" rel="noopener noreferrer">Wine.com</a></li>
                        <li><a href="https://www.winespectator.com/vintage-charts" target="_blank" rel="noopener noreferrer">Vintage Charts</a></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h4>Stay Updated</h4>
                    <p>Subscribe to our newsletter.</p>
                    <div className="newsletter-form">
                        <input type="email" placeholder="Your email" />
                        <button className="btn-modern btn-newsletter">Subscribe</button>
                    </div>
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
                
                // Set the wine data directly
                setWines(wineData);
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
    const [currentPage, setCurrentPage] = useState(1);
    const winesPerPage = 12;

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
    
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const handleTasteChange = (wineId, status) => {
        const wine = wines.find(w => w.id === wineId);
        if (wine && status) {
            trackTastingAction(wine, status);
        }
        
        setTastingRecord(prevRecord => {
            const newRecord = { ...prevRecord };
            if (status === null) {
                delete newRecord[wineId];
            } else {
                newRecord[wineId] = status;
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

    useScrollAnimation();

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

    const indexOfLastWine = currentPage * winesPerPage;
    const indexOfFirstWine = indexOfLastWine - winesPerPage;
    const currentWines = filteredWines.slice(indexOfFirstWine, indexOfLastWine);
    
    const paginate = pageNumber => {
        setCurrentPage(pageNumber);
        const wineListElement = document.getElementById('wine-list-container');
        if (wineListElement) {
            const elementTop = wineListElement.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({ top: elementTop - 100, behavior: 'smooth' });
        }
        trackEvent('pagination_used', { page: pageNumber });
    };

    return (
        <Fragment>
            <Navigation />
            <Hero />
            <main>
                <section id="wines" className="wines-section">
                    <div className="container">
                        <div className="section-header">
                            <h2>Wine Explorer</h2>
                            <p>Discover the finest wines from around the world</p>
                            <div className="year-selector-container">
                                <select 
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
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
                                            />
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                        <Pagination 
                            winesPerPage={winesPerPage} 
                            totalWines={filteredWines.length} 
                            paginate={paginate} 
                            currentPage={currentPage} 
                        />
                    </div>
                </section>
            </main>
            <Footer />
            <ComparisonBar 
                compareWines={compareWines}
                onRemove={handleRemoveFromComparison}
                onCompare={handleCompare}
            />
            <WineDetailModal 
                wine={selectedWine} 
                isOpen={!!selectedWine} 
                onClose={() => setSelectedWine(null)} 
                tastingRecord={tastingRecord} 
                onTasteChange={handleTasteChange} 
            />
            <ComparisonModal 
                wines={compareWines}
                isOpen={showComparisonModal}
                onClose={() => setShowComparisonModal(false)}
            />
            <WelcomePopup 
                isOpen={showWelcomePopup} 
                onClose={() => setShowWelcomePopup(false)} 
            />
            <TastingTrackerPanel 
                isOpen={showTastingPanel}
                onToggle={() => setShowTastingPanel(!showTastingPanel)}
                tastingRecord={tastingRecord}
                wines={wines}
                onTasteChange={handleTasteChange}
            />
        </Fragment>
    );
};

export default App;
