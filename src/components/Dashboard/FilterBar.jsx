// FilterBar.js
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboard,
    faExpand,
    faFile,
    faPrint,
    faTrash,
    faPlus,
    faSearch,
} from '@fortawesome/free-solid-svg-icons'; // Import component form
import './css/FilterBar.css'; // Import CSS file for styling

const FilterBar = ({ onAddClick }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        // TODO: Implement search functionality
    };

    const handleActionClick = (action) => {
        // TODO: Implement action functionality
        console.log(`Action clicked: ${action}`);
    };

    return (
        <div className='filter-bar'>
            <div className='search-container'>
                <FontAwesomeIcon icon={faSearch} className='search-icon' />
                <input
                    className='search-input'
                    type='text'
                    placeholder='Tìm kiếm phòng trọ...'
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>

            <div className='filter-actions'>
                <button
                    className='icon-btn'
                    data-tooltip='Sao chép'
                    onClick={() => handleActionClick('copy')}
                >
                    <FontAwesomeIcon icon={faClipboard} />
                </button>
                <button
                    className='icon-btn'
                    data-tooltip='Mở rộng'
                    onClick={() => handleActionClick('expand')}
                >
                    <FontAwesomeIcon icon={faExpand} />
                </button>
                <button
                    className='icon-btn'
                    data-tooltip='Xuất file'
                    onClick={() => handleActionClick('export')}
                >
                    <FontAwesomeIcon icon={faFile} />
                </button>
                <button
                    className='icon-btn'
                    data-tooltip='In'
                    onClick={() => handleActionClick('print')}
                >
                    <FontAwesomeIcon icon={faPrint} />
                </button>
                <button
                    className='icon-btn'
                    data-tooltip='Xóa'
                    onClick={() => handleActionClick('delete')}
                >
                    <FontAwesomeIcon icon={faTrash} />
                </button>
            </div>

            <button
                className='add-btn extended'
                onClick={onAddClick}
                title='Thêm phòng mới'
            >
                <FontAwesomeIcon icon={faPlus} />
                <span>Thêm phòng mới</span>
            </button>
        </div>
    );
};

export default FilterBar;
