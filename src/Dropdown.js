import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CheckTree from 'rsuite-check-tree';
import classNames from 'classnames';
import { on } from 'dom-lib';
import { IntlProvider, FormattedMessage } from 'rsuite-intl';
import _ from 'lodash';

import defaultLocale from './locale/index';
import decorate from './utils/decorate';
import reactToString from './utils/reactToString';
import DropdownToggle from './DropdownToggle';
import SearchBar from './SearchBar';
import filterNodesOfTree from './utils/filterNodesOfTree';

const propTypes = {
  ...CheckTree.propTypes,
  disabled: PropTypes.bool,
  expand: PropTypes.bool,
  dropup: PropTypes.bool,
  autoAdjustPosition: PropTypes.bool,
  locale: PropTypes.object,
  placeholder: PropTypes.string,
  searchable: PropTypes.bool,
  onSearch: PropTypes.func,
  onToggle: PropTypes.func
};

const defaultProps = {
  ...CheckTree.defaultProps,
  value: [],
  disabled: PropTypes.false,
  expand: false,
  locale: defaultLocale,
  autoAdjustPosition: true,
  cleanable: true,
  searchable: true,
  placeholder: 'placeholder'
};

class Dropdown extends Component {
  constructor(props) {
    super(props);
    this.isControlled = 'value' in props && 'onChange' in props && props.onChange;
    const { dropup, value, expand, data } = props;
    this.state = {
      data,
      dropup,
      value,
      expand,
      searchKeyword: '',
    };
  }

  componentDidMount() {
    this.isMounted = true;
  }

  componentWillReceiveProps(nextProps) {
    const { value, data, dropup } = nextProps;
    if (
      !_.isEqual(value, this.props.value) ||
      !_.isEqual(data, this.props.data) ||
      !_.isEqual(dropup, this.props.dropup)
    ) {
      this.setState({
        dropup,
        value,
        data
      });
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.expand === this.state.expand) {
      return;
    }

    if (nextState.expand) {
      this.bindEvent();
      this.autoAdjustDropdownPosition();

    } else {
      this.unbindEvent();
    }
  }

  componentWillUnmount() {
    this.unbindEvent();
    this.isMounted = false;
  }

  getValue() {
    const { value } = this.props;
    const nextValue = _.isUndefined(value) ? this.state.value : value;
    return _.clone(nextValue) || [];
  }

  get isMounted() {
    return this.mounted;
  }

  set isMounted(isMounted) {
    this.mounted = isMounted;
  }

  shouldDisplay(label) {
    const { searchKeyword } = this.state;
    if (!_.trim(searchKeyword)) {
      return true;
    }
    const keyword = searchKeyword.toLocaleLowerCase();
    if (typeof label === 'string') {
      return label.toLocaleLowerCase().indexOf(keyword) >= 0;
    } else if (React.isValidElement(label)) {
      const nodes = reactToString(label);
      return nodes.join('').toLocaleLowerCase().indexOf(keyword) >= 0;
    }
    return false;
  }

  bindEvent = (e) => {
    this.docClickListener = on(document, 'click', this.handleDocumentClick);
    this.docScrollListener = on(document, 'scroll', this.autoAdjustDropdownPosition);
    this.docResizelListener = on(window, 'resize', this.autoAdjustDropdownPosition);
  }

  unbindEvent = (e) => {
    this.docClickListener && this.docClickListener.off();
    this.docScrollListener && this.docClickListener.off();
    this.docResizelListener && this.docClickListener.off();
  }

  autoAdjustDropdownPosition = (e) => {
    const { height, dropup } = this.props;
    if (!this.isMounted) {
      return;
    }

    if (!_.isUndefined(dropup)) {
      this.setState({ dropup });
      return;
    }

    const el = this.container;
    if (
      el.getBoundingClientRect().bottom + height > window.innerHeight
      && el.getBoundingClientRect().top - height > 0
    ) {
      this.setState({ dropup: true });
    } else {
      this.setState({ dropup: false });
    }
  }

  handleDocumentClick = (e) => {
    if (this.isMounted && !this.container.contains(e.target)) {
      this.setState({
        expand: false
      });
    }
  }

  /**
   * 选择树节点后的回调函数
   */
  handleSelect = (activeNode, layer, values) => {
    const { onSelect } = this.props;
    onSelect && onSelect(activeNode, layer, values);
  }

  /**
   * 展开树节点后的回调函数
   */
  handleExpand = (activeNode, layer) => {
    const { onExpand } = this.props;
    onExpand && onExpand(activeNode, layer);
  }

  /**
   * 数据改变后的回调函数
   */
  handleOnChange = (values) => {
    const { onChange } = this.props;
    if (!this.isControlled) {
      this.setState({
        value: values
      });
    } else {
      onChange && onChange(values);
    }
  }

  handleToggleDropdown = (e) => {
    const { onToggle, disabled } = this.props;
    if (disabled) {
      return;
    }
    this.setState((prevState) => {
      return {
        expand: !prevState.expand
      };
    });

    onToggle && onToggle(e);
  }

  handleSearch = (value, e) => {
    this.setState({
      searchKeyword: value
    });
  }

  handleClean = (e) => {
    this.setState({
      value: []
    });
  }

  renderDropdownMenu() {
    const { value, data, dropup } = this.state;
    const {
      labelKey,
      searchable
    } = this.props;
    const classes = classNames('dropdown', {
      'menu-dropup': dropup,
    });

    const filterData = filterNodesOfTree(data, item => this.shouldDisplay(item[labelKey]));
    const menuProps = _.pick(this.props, Object.keys(CheckTree.propTypes));

    const dropdownMenu = (
      <CheckTree
        {...menuProps}
        ref={(ref) => {
          this.menuContainer = ref;
        }}
        value={value}
        key="dropdownMenu"
        data={filterData}
        onChange={this.handleOnChange}
        onSelect={this.handleSelect}
        onExpand={this.handleExpand}
      />
    );

    const searchBar = searchable ?
      (
        <SearchBar
          key="searchBar"
          onChange={this.handleSearch}
          value={this.state.searchKeyword}
        />
      )
      : null;

    return (
      <div
        className={classes}
      >
        {dropup ? [dropdownMenu, searchBar] : [searchBar, dropdownMenu]}
      </div>
    );
  }

  render() {
    const { value, expand, dropup, data } = this.state;
    const {
      locale,
      disabled,
      inverse,
      className,
      placeholder,
      cleanable,
      renderPlaceholder,
      valueKey,
      ...props,
     } = this.props;
    const classes = classNames(this.prefix('dropdown'), {
      [this.prefix('dropup')]: dropup,
      disabled,
      inverse,
      expand,
    }, className);

    let placeholderText = (value && value.length) ? `${value.length} selected` : (
      <div className="placeholder-text">
        <FormattedMessage id={placeholder} />
      </div>
    );

    if (renderPlaceholder) {
      placeholderText = renderPlaceholder(
        value,
        data.filter(item => value.some(val => _.eq(item[valueKey], val))),
        placeholderText
      );
    }
    const elementProps = _.omit(props, Object.keys(propTypes));

    return (
      <IntlProvider locale={locale}>
        <div
          {...elementProps}
          className={classes}
          onKeyDown={this.handleKeyDown}
          tabIndex={-1}
          role="menu"
          ref={(ref) => {
            this.container = ref;
          }}
        >
          <DropdownToggle
            onClick={this.handleToggleDropdown}
            onClean={this.handleClean}
            cleanable={cleanable && !disabled}
            value={value}
          >
            {placeholderText}
          </DropdownToggle>
          {expand && this.renderDropdownMenu()}
        </div>
      </IntlProvider>
    );
  }
}

Dropdown.propTypes = propTypes;

Dropdown.defaultProps = defaultProps;

export default decorate()(Dropdown);